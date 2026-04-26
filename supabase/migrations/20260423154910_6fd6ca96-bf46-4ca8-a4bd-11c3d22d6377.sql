UPDATE public.products
SET image_url = CASE name

  WHEN 'Organic Bananas' THEN 'https://images.unsplash.com/photo-1574226516831-e1dff420e43e?w=400&q=80'
  WHEN 'Whole Wheat Bread' THEN 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'
  WHEN 'Peanut Butter' THEN 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80'
  WHEN 'Greek Yogurt' THEN 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80'
  WHEN 'Honey Jar' THEN 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80'

  WHEN 'Pasta Penne' THEN 'https://images.unsplash.com/photo-1589307004173-3c6b0a1a8a8b?w=400&q=80'
  WHEN 'Marinara Sauce' THEN 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&q=80'
  WHEN 'Parmesan Cheese' THEN 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&q=80'
  WHEN 'Granola Bars' THEN 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80'

  WHEN 'Cucumber' THEN 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80'
  WHEN 'Carrots' THEN 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80'
  WHEN 'Potatoes' THEN 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80'
  WHEN 'Onions' THEN 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80'
  WHEN 'Garlic' THEN 'https://images.unsplash.com/photo-1615478503562-ec2d8aa0e24e?w=400&q=80'

  WHEN 'Romaine Lettuce' THEN 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=400&q=80'
  WHEN 'Broccoli' THEN 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80'
  WHEN 'Cauliflower' THEN 'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=400&q=80'
  WHEN 'Bell Peppers' THEN 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80'
  WHEN 'Lemons' THEN 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&q=80'

  WHEN 'Chicken Breast' THEN 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80'
  WHEN 'Salmon Fillet' THEN 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400&q=80'
  WHEN 'Ground Turkey' THEN 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80'
  WHEN 'Paneer Cubes' THEN 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80'

  WHEN 'Cheddar Cheese' THEN 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&q=80'
  WHEN 'Mozzarella Cheese' THEN 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80'
  WHEN 'Unsalted Butter' THEN 'https://images.unsplash.com/photo-1589985270958-b7f9f213d8f4?w=400&q=80'

  WHEN 'Brown Rice' THEN 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80'
  WHEN 'Quinoa' THEN 'https://images.unsplash.com/photo-1615485925763-86786288908c?w=400&q=80'
  WHEN 'Chickpeas Canned' THEN 'https://images.unsplash.com/photo-1615485925877-ec8076c5d9e3?w=400&q=80'
  WHEN 'Kidney Beans Canned' THEN 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80'
  WHEN 'Olive Oil' THEN 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80'
  WHEN 'Tomato Ketchup' THEN 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&q=80'
  WHEN 'Mayonnaise' THEN 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80'

  WHEN 'Corn Flakes' THEN 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&q=80'
  WHEN 'Whole Grain Cereal' THEN 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80'
  WHEN 'Trail Mix' THEN 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80'
  WHEN 'Chocolate Chip Cookies' THEN 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80'
  WHEN 'Green Tea Bags' THEN 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80'
  WHEN 'Black Tea Bags' THEN 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80'

  ELSE image_url
END;