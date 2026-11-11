SELECT id, name, referee_id
FROM customer
WHERE referee_id IS NULL OR referee_id <> 2
ORDER BY id;
