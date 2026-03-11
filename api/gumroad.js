export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    email,
    product_id,
    sale_id,
    refunded,
  } = req.body;

  // Replace this with your actual Gumroad product ID
  const CAPCREATE_PRO_ID = "YOUR_GUMROAD_PRODUCT_ID";

  if (product_id !== CAPCREATE_PRO_ID) {
    return res.status(400).json({ error: "Invalid product" });
  }

  // Store Pro status (example using Vercel KV)
  await kv.set(`pro:${email}`, true);

  return res.status(200).json({ success: true });
}
