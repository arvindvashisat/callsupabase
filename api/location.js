import { Pool } from "pg";

const pool = new Pool({
  host: "aws-1-eu-west-2.pooler.supabase.com",
  port: 6543,
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
    let body = req.body;

    // form-data/raw support
    if (!body || Object.keys(body).length === 0) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const raw = Buffer.concat(buffers).toString();

      try {
        body = JSON.parse(raw);
      } catch (e) {
        body = Object.fromEntries(new URLSearchParams(raw));
      }
    }

    // ✅ body array hona chahiye
    if (!Array.isArray(body) || body.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Request body must be a non-empty array",
      });
    }

    // Optional safety limit
    if (body.length > 100) {
      return res.status(400).json({
        status: false,
        message: "Maximum 100 rows allowed per request",
      });
    }

    const placeholders = [];
    const values = [];

    body.forEach((row, index) => {
      if (!row.user_id) {
        throw new Error(`user_id is required at row ${index + 1}`);
      }

      // IST time
      const now = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
      const formattedDate = now.toISOString().slice(0, 10);
      const formattedTime = now.toISOString().slice(11, 19);
      const modify_at = `${formattedDate} ${formattedTime}`;

      // object/array ko safely string banao
      let mnc_data = row.mnc_data ?? null;
      let wifi_data = row.wifi_data ?? null;

      if (typeof mnc_data === "object") {
        mnc_data = JSON.stringify(mnc_data);
      }

      if (typeof wifi_data === "object") {
        wifi_data = JSON.stringify(wifi_data);
      }

      const base = index * 37;

      placeholders.push(`(
        $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4},
        $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8},
        $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12},
        $${base + 13}, $${base + 14}, $${base + 15},
        $${base + 16}, $${base + 17},
        $${base + 18}, $${base + 19},
        $${base + 20}, $${base + 21}, $${base + 22},
        $${base + 23}, $${base + 24},
        $${base + 25}, $${base + 26}, $${base + 27}, $${base + 28}, $${base + 29},
        $${base + 30}, $${base + 31},
        $${base + 32}, $${base + 33}, $${base + 34},
        $${base + 35}, $${base + 36}, $${base + 37}
      )`);

      values.push(
        row.user_id,

        row.date ?? formattedDate,
        row.time_loc ?? formattedTime,
        row.location_type ?? null,

        row.latitude ?? null,
        row.latitude_rep ?? null,
        row.longitude ?? null,
        row.longitude_rep ?? null,

        row.speed ?? null,
        row.direction ?? null,
        row.altitude ?? null,
        row.satellites_no ?? null,

        row.gsm_signal_strength ?? null,
        row.battery ?? null,
        row.steps ?? null,

        row.terminal_status_hexadecimal ?? null,
        row.terminal_status ?? null,

        row.no_of_base_stations ?? null,
        row.connected_base_station ?? null,

        row.mcc_country_code ?? null,
        row.mnc_network_code ?? null,
        mnc_data,

        row.no_of_wifi ?? null,
        wifi_data,

        row.modify_at ?? modify_at,
        row.status ?? null,
        row.address ?? null,
        row.country ?? null,
        row.city ?? null,

        row.no_of_roll_overs ?? null,
        row.type_of_location ?? null,

        row.wb_date ?? null,
        row.wb_time ?? null,
        row.postdate_wb ?? null,

        row.manualUpdate ?? 0,
        row.wb_lat ?? null,
        row.wb_log ?? null
      );
    });

    const query = `
      INSERT INTO public.ps_location (
        user_id, date, time_loc, location_type,
        latitude, latitude_rep, longitude, longitude_rep,
        speed, direction, altitude, satellites_no,
        gsm_signal_strength, battery, steps,
        terminal_status_hexadecimal, terminal_status,
        no_of_base_stations, connected_base_station,
        mcc_country_code, mnc_network_code, mnc_data,
        no_of_wifi, wifi_data,
        modify_at, status, address, country, city,
        no_of_roll_overs, type_of_location,
        wb_date, wb_time, postdate_wb,
        "manualUpdate", wb_lat, wb_log
      )
      VALUES ${placeholders.join(",")}
    `;

    await pool.query(query, values);

    return res.status(200).json({
      status: true,
      message: `${body.length} location rows inserted successfully`,
      inserted_count: body.length,
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message,
    });
  }
}