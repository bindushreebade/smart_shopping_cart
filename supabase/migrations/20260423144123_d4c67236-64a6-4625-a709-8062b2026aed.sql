-- Products catalog
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rfid_tag TEXT UNIQUE NOT NULL,
  image_url TEXT,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cart sessions
CREATE TABLE public.cart_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget NUMERIC(10,2) NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','checked_out','abandoned')),
  customer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cart items
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.cart_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.cart_sessions(id),
  subtotal NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi','card','wallet')),
  status TEXT NOT NULL DEFAULT 'completed',
  reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product recommendations (if you buy A, suggest B)
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  target_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL DEFAULT 1,
  UNIQUE (source_product_id, target_product_id)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Policies — kiosk-style demo: open access
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public write products" ON public.products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read carts" ON public.cart_sessions FOR SELECT USING (true);
CREATE POLICY "Public write carts" ON public.cart_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read items" ON public.cart_items FOR SELECT USING (true);
CREATE POLICY "Public write items" ON public.cart_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read tx" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public write tx" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read recs" ON public.recommendations FOR SELECT USING (true);
CREATE POLICY "Public write recs" ON public.recommendations FOR ALL USING (true) WITH CHECK (true);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER products_touch BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER carts_touch BEFORE UPDATE ON public.cart_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Atomic checkout function with row-level locking to prevent overselling
CREATE OR REPLACE FUNCTION public.checkout_cart(
  _cart_id UUID,
  _payment_method TEXT,
  _tax_rate NUMERIC DEFAULT 0.08
) RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item RECORD;
  _subtotal NUMERIC := 0;
  _tax NUMERIC;
  _total NUMERIC;
  _tx public.transactions;
  _ref TEXT;
BEGIN
  -- Lock all involved products to prevent race conditions
  FOR _item IN
    SELECT ci.product_id, ci.quantity, ci.unit_price, p.stock, p.name
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = _cart_id
    FOR UPDATE OF p
  LOOP
    IF _item.stock < _item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %', _item.name;
    END IF;
    _subtotal := _subtotal + (_item.quantity * _item.unit_price);
  END LOOP;

  IF _subtotal = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Decrement stock
  UPDATE products p
  SET stock = p.stock - ci.quantity
  FROM cart_items ci
  WHERE ci.cart_id = _cart_id AND ci.product_id = p.id;

  _tax := ROUND(_subtotal * _tax_rate, 2);
  _total := _subtotal + _tax;
  _ref := 'TXN-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));

  INSERT INTO transactions (cart_id, subtotal, tax, total, payment_method, reference)
  VALUES (_cart_id, _subtotal, _tax, _total, _payment_method, _ref)
  RETURNING * INTO _tx;

  UPDATE cart_sessions SET status='checked_out' WHERE id = _cart_id;

  RETURN _tx;
END;
$$;