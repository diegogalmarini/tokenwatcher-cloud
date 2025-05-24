// dashboard/tokenwatcher-app/pages/api/watchers/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

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
    const { id } = req.query;

    // GET a single watcher by id
    if (req.method === 'GET') {
      const { rows } = await client.query(
        `
          SELECT
            id,
            token_address,
            threshold,
            webhook_url,
            created_at
          FROM watchers
          WHERE id = $1
        `,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Watcher not found' });
      }
      return res.status(200).json(rows[0]);
    }

    // UPDATE a watcher
    if (req.method === 'PUT') {
      // Map incoming field names (camelCase or snake_case)
      const tokenAddress = req.body.token_address ?? req.body.tokenAddress;
      const threshold = req.body.threshold;
      const webhookUrl = req.body.webhook_url ?? req.body.webhookUrl;
      if (!tokenAddress || threshold == null || !webhookUrl) {
        return res.status(422).json({ error: 'Missing fields: token_address, threshold or webhook_url' });
      }
      const { rows } = await client.query(
        `
          UPDATE watchers
          SET
            token_address = $1,
            threshold = $2,
            webhook_url = $3
          WHERE id = $4
          RETURNING *
        `,
        [tokenAddress, threshold, webhookUrl, id]
      );
      return res.status(200).json(rows[0]);
    }

    // DELETE a watcher
    if (req.method === 'DELETE') {
      // Remove related events to avoid FK violations
      await client.query(
        `DELETE FROM events WHERE watcher_id = $1`,
        [id]
      );
      await client.query(
        `DELETE FROM watchers WHERE id = $1`,
        [id]
      );
      return res.status(200).json({});
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}