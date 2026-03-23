import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Only POST allowed" });
  }

  try {
    const {
      channel,
      rawdata,
      created_at='',
      wbread = 0,
      imei_number,
      type,
    } = req.body;

    if (!channel || !rawdata) {
      return res.status(400).json({
        status: false,
        message: "channel and rawdata required",
      });
    }

    const query = `
      INSERT INTO public.tblcwbdata 
      (channel, rawdata, created_at, wbread, imei_number, type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(query, [
      channel,
      rawdata,
      created_at || new Date(),
      wbread,
      imei_number,
      type,
    ]);

    return res.status(200).json({
      status: true,
      message: "Data inserted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
}
