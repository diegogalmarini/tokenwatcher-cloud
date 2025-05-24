// dashboard/tokenwatcher-app/pages/api/watchers/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await pool.connect();
  try {
    if (req.method === "GET") {
      // Incluimos webhook_url en el SELECT
      const { rows } = await client.query(`
        SELECT
          id,
          token_address,
          threshold,
          webhook_url,
          created_at
        FROM watchers
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      // Desestructuramos webhook_url desde el body
      const { token_address, threshold, webhook_url } = req.body;
      const { rows } = await client.query(
        `
        INSERT INTO watchers
          (token_address, threshold, webhook_url)
        VALUES ($1, $2, $3)
        RETURNING id, token_address, threshold, webhook_url, created_at
      `,
        [token_address, threshold, webhook_url || null]
      );
      return res.status(201).json(rows[0]);
    }

    // (puedes añadir PUT/DELETE en pages/api/watchers/[id].ts)
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
