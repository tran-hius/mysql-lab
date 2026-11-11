SELECT product_id, low_fats, recyclable
FROM products
WHERE low_fats = 'Y' AND recyclable = 'Y'
ORDER BY product_id;
