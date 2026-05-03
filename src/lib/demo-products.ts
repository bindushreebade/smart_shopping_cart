export interface DemoProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  rfid_tag: string;
  image_url: string;
  category: string;
  description: string;
  aisle?: number;
  shelf?: string;
}

export function normalizeProductName(name: string | null | undefined): string {
  return name?.trim() ?? "";
}

export function isBlockedProductName(name: string | null | undefined): boolean {
  return !normalizeProductName(name);
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: "prod-2001", name: "Cucumber", price: 1.49, stock: 60, rfid_tag: "RFID-2001", image_url: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&q=80", category: "produce", description: "Fresh green cucumbers", aisle: 1, shelf: "top" },
  { id: "prod-2002", name: "Carrots", price: 1.99, stock: 70, rfid_tag: "RFID-2002", image_url: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80", category: "produce", description: "Crunchy orange carrots", aisle: 1, shelf: "top" },
  { id: "prod-2003", name: "Potatoes", price: 2.99, stock: 80, rfid_tag: "RFID-2003", image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80", category: "produce", description: "All-purpose potatoes", aisle: 1, shelf: "middle" },
  { id: "prod-2004", name: "Onions", price: 1.79, stock: 75, rfid_tag: "RFID-2004", image_url: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80", category: "produce", description: "Yellow onions", aisle: 1, shelf: "middle" },
  { id: "prod-2005", name: "Garlic", price: 0.99, stock: 90, rfid_tag: "RFID-2005", image_url: "https://images.unsplash.com/photo-1501420193726-1f65acd36cda?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", category: "produce", description: "Fresh garlic bulbs", aisle: 1, shelf: "bottom" },
  { id: "prod-2006", name: "Romaine Lettuce", price: 2.49, stock: 55, rfid_tag: "RFID-2006", image_url: "https://images.unsplash.com/photo-1699449914085-085948569952?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", category: "produce", description: "Crisp romaine lettuce", aisle: 1, shelf: "bottom" },
  { id: "prod-2008", name: "Cauliflower", price: 2.69, stock: 45, rfid_tag: "RFID-2008", image_url: "https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=400&q=80", category: "produce", description: "Whole cauliflower head", aisle: 1, shelf: "top" },
  { id: "prod-2009", name: "Bell Peppers", price: 3.49, stock: 60, rfid_tag: "RFID-2009", image_url: "https://media.istockphoto.com/id/897503508/photo/colorful-paprika-background.jpg?s=612x612&w=is&k=20&c=_ExBeS_RjYV-Ku3TjoqlFT4Bs38Efv0t-1wMv05G1mU=", category: "produce", description: "Mixed bell peppers pack", aisle: 1, shelf: "middle" },
  { id: "prod-2010", name: "Lemons", price: 2.19, stock: 65, rfid_tag: "RFID-2010", image_url: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&q=80", category: "produce", description: "Juicy lemons", aisle: 1, shelf: "bottom" },
  { id: "prod-2011", name: "Chicken Breast", price: 8.99, stock: 40, rfid_tag: "RFID-2011", image_url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80", category: "protein", description: "Boneless skinless chicken breast", aisle: 2, shelf: "top" },
  { id: "prod-2012", name: "Salmon Fillet", price: 11.99, stock: 30, rfid_tag: "RFID-2012", image_url: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400&q=80", category: "protein", description: "Atlantic salmon fillet", aisle: 2, shelf: "top" },
  { id: "prod-2013", name: "Ground Turkey", price: 6.49, stock: 35, rfid_tag: "RFID-2013", image_url: "https://media.istockphoto.com/id/1887064786/photo/raw-mince-or-ground-chicken-meat-isolated-on-white-background-top-view.jpg?s=2048x2048&w=is&k=20&c=ab7qdz8nanFheMpgztNDwTcyAcXHiwpd9sWiGvpIcrQ=", category: "protein", description: "Lean ground turkey", aisle: 2, shelf: "top" },
  { id: "prod-2014", name: "Paneer Cubes", price: 4.99, stock: 45, rfid_tag: "RFID-2014", image_url: "https://media.istockphoto.com/id/1210307314/photo/homemade-indian-paneer-cheese-made-from-fresh-milk-and-lemon-juice-diced-in-a-wooden-bowl-on.jpg?s=2048x2048&w=is&k=20&c=PKc7EEfJsysYw_DWpM-9DJ_Nb2aiPix-oG1JKyyaWWw=", category: "dairy", description: "Fresh paneer cubes", aisle: 2, shelf: "middle" },
  { id: "prod-2015", name: "Cheddar Cheese", price: 4.49, stock: 50, rfid_tag: "RFID-2015", image_url: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&q=80", category: "dairy", description: "Aged cheddar block", aisle: 2, shelf: "middle" },
  { id: "prod-2016", name: "Mozzarella Cheese", price: 3.99, stock: 50, rfid_tag: "RFID-2016", image_url: "https://media.istockphoto.com/id/480194612/photo/single-ball-of-mozzarella-cheese-sliced-and-isolated-on-rustice.jpg?s=2048x2048&w=is&k=20&c=3EWyz35pkkC-UFJ8DQGCDppye6svjmiPTej1EBcSCI8=", category: "dairy", description: "Shredded mozzarella", aisle: 2, shelf: "bottom" },
  { id: "prod-2017", name: "Unsalted Butter", price: 3.79, stock: 60, rfid_tag: "RFID-2017", image_url: "https://media.istockphoto.com/id/619748956/photo/sticks-of-butter.jpg?s=2048x2048&w=is&k=20&c=kDNQm-iJ0lEoH_W4MYHIZuINf_KN3_uncLmvjr-ivE4=", category: "dairy", description: "Creamy unsalted butter", aisle: 2, shelf: "bottom" },
  { id: "prod-2018", name: "Brown Rice", price: 5.49, stock: 55, rfid_tag: "RFID-2018", image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80", category: "pantry", description: "Whole grain brown rice", aisle: 3, shelf: "top" },
  { id: "prod-2019", name: "Quinoa", price: 6.29, stock: 45, rfid_tag: "RFID-2019", image_url: "https://media.istockphoto.com/id/1194493083/photo/quinoa-seed-in-white-bowl-on-white-background-dried-cereals-in-cup-vegan-food-fodmap-diet.jpg?s=2048x2048&w=is&k=20&c=YBvNEBc4mlP6lYfoLV2Mum9K7WYAnzoYwk5bC5OD--A=", category: "pantry", description: "Organic white quinoa", aisle: 3, shelf: "top" },
  { id: "prod-2020", name: "Chickpeas Canned", price: 1.49, stock: 80, rfid_tag: "RFID-2020", image_url: "https://images.unsplash.com/photo-1615485925877-ec8076c5d9e3?w=400&q=80", category: "pantry", description: "Ready-to-use chickpeas", aisle: 3, shelf: "middle" },
  { id: "prod-2021", name: "Kidney Beans Canned", price: 1.59, stock: 80, rfid_tag: "RFID-2021", image_url: "https://media.istockphoto.com/id/1182345401/photo/fiamma-vesuviana-red-kidney-beans.jpg?s=2048x2048&w=is&k=20&c=9R7Q_XZjpjyBnJPS3M84MIMKFZjodNk0yibrYBnZXrg=", category: "pantry", description: "Canned red kidney beans", aisle: 3, shelf: "middle" },
  { id: "prod-2022", name: "Olive Oil", price: 9.49, stock: 40, rfid_tag: "RFID-2022", image_url: "https://media.istockphoto.com/id/1395787495/photo/bowl-of-spicy-oil.jpg?s=612x612&w=is&k=20&c=xIZp3lVHvg1eo-HNsiBcnhQCdWL6rZcLvBUCnzimSiM=", category: "pantry", description: "Extra virgin olive oil", aisle: 3, shelf: "bottom" },
  { id: "prod-2023", name: "Tomato Ketchup", price: 2.89, stock: 65, rfid_tag: "RFID-2023", image_url: "https://media.istockphoto.com/id/519998913/photo/bottle-with-tomato-ketchup.jpg?s=612x612&w=is&k=20&c=tUuxNNS7tKlywcvpM8JS_eCgfg2WhonBBYlfIfXDrmQ=", category: "pantry", description: "Classic tomato ketchup", aisle: 3, shelf: "bottom" },
  { id: "prod-2024", name: "Mayonnaise", price: 3.29, stock: 55, rfid_tag: "RFID-2024", image_url: "https://media.istockphoto.com/id/174984217/photo/mayonnaise-bottle-on-a-white-background.jpg?s=612x612&w=is&k=20&c=TYpRoGAEM39RvEtmSJElA2AT4q7AroTz12oEuxpPp9c=", category: "pantry", description: "Creamy mayonnaise", aisle: 3, shelf: "bottom" },
  { id: "prod-2025", name: "Corn Flakes", price: 4.19, stock: 50, rfid_tag: "RFID-2025", image_url: "https://media.istockphoto.com/id/1030319626/photo/3d-rendering-of-corn-flakes-paper-packaging-isolated-on-white-background.jpg?s=612x612&w=is&k=20&c=W_06hQYewD_BU4vNIf0ErZV66FkH7wmtu9j3DNOdL08=", category: "breakfast", description: "Crunchy corn flakes cereal", aisle: 4, shelf: "top" },
  { id: "prod-2026", name: "Whole Grain Cereal", price: 4.69, stock: 45, rfid_tag: "RFID-2026", image_url: "https://media.istockphoto.com/id/1907656974/photo/pearl-barley-background.jpg?s=612x612&w=is&k=20&c=ZqVYH_yL0jinb8liEYhsAFBMTpIXVJkU8MYKqffTMDs=", category: "breakfast", description: "Fiber-rich breakfast cereal", aisle: 4, shelf: "top" },
  { id: "prod-2027", name: "Trail Mix", price: 5.29, stock: 50, rfid_tag: "RFID-2027", image_url: "https://media.istockphoto.com/id/1192321004/photo/trail-mix-nuts.jpg?s=612x612&w=is&k=20&c=z-jctVYonNyr7zCi16RWzsLPoDlDY_zUwmRhoiOBivk=", category: "snacks", description: "Nuts and dried fruits blend", aisle: 4, shelf: "middle" },
  { id: "prod-2028", name: "Chocolate Chip Cookies", price: 3.99, stock: 55, rfid_tag: "RFID-2028", image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80", category: "snacks", description: "Classic chocolate chip cookies", aisle: 4, shelf: "middle" },
  { id: "prod-2029", name: "Green Tea Bags", price: 3.49, stock: 60, rfid_tag: "RFID-2029", image_url: "https://media.istockphoto.com/id/1189072214/photo/twisted-tea-ahmad-harrods-harrods-com-twinings-goodwyn-iced-tea-twinings-tea.jpg?s=612x612&w=is&k=20&c=bJuiGEqY7xkr8wpfXTfns-vkmmXJwCeNroTl_kikL2M=", category: "beverage", description: "Green tea bags pack", aisle: 4, shelf: "bottom" },
  { id: "prod-2030", name: "Black Tea Bags", price: 3.39, stock: 60, rfid_tag: "RFID-2030", image_url: "https://media.istockphoto.com/id/1739130035/photo/paperboard-box-of-black-tea-bags-on-a-gray-background.jpg?s=612x612&w=is&k=20&c=m2S2kENv2cdc4ezRN6rFCzDazIRgoH9IqaW-9bOJNcI=", category: "beverage", description: "Black tea bags pack", aisle: 4, shelf: "bottom" },
];
