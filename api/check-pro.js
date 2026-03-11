export default async function handler(req, res) {
  const { email } = req.query;

  const isPro = await kv.get(`pro:${email}`);

  return res.status(200).json({ pro: !!isPro });
}
