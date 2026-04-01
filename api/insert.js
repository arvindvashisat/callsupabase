import { Pool } from "pg";

const pool = new Pool({
  host: "aws-1-eu-west-2.pooler.supabase.com",
  port: "6543",
  user: "postgres.eehzfwsligsyqvhphyph",
  password: "8T85LRLD751H07BK",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: false,
      message: "Only POST allowed",
    });
  }

  try {
    const rows = req.body;

    // Body array hona chahiye
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Request body must be a non-empty array",
      });
    }

    // Optional safety: max 100 rows ek baar me
    if (rows.length > 100) {
      return res.status(400).json({
        status: false,
        message: "Maximum 100 rows allowed per request",
      });
    }

    const values = [];
    const placeholders = [];

    rows.forEach((row, index) => {
      const {
        channel,
        rawdata,
        created_at,
        wbread = 0,
        imei_number,
        type,
      } = row;

      // Required fields check
      if (!channel || !rawdata) {
        throw new Error(`channel and rawdata required at row ${index + 1}`);
      }

      const baseIndex = index * 6;

      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`
      );

      values.push(
        channel,
        rawdata,
        created_at,
        wbread,
        imei_number || null,
        type || null
      );
    });

    const query = `
      INSERT INTO public.tblcwbdata 
      (channel, rawdata, created_at, wbread, imei_number, type)
      VALUES ${placeholders.join(", ")}
    `;

    await pool.query(query, values);

    return res.status(200).json({
      status: true,
      message: `${rows.length} rows inserted successfully`,
      inserted_count: rows.length,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
}