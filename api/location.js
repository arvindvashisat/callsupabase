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

    // ✅ form-data support
    if (!body || Object.keys(body).length === 0) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const raw = Buffer.concat(buffers).toString();
      body = Object.fromEntries(new URLSearchParams(raw));
    }

    // ✅ validation
    if (!body.user_id) {
      return res.status(400).json({
        status: false,
        message: "user_id is required",
      });
    }

    // ✅ IST Date/Time
    const now = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    const formattedDate = now.toISOString().slice(0, 10);
    const formattedTime = now.toISOString().slice(11, 19);
    const modify_at = `${formattedDate} ${formattedTime}`;

    // ✅ FULL QUERY
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
    VALUES (
      $1,$2,$3,$4,
      $5,$6,$7,$8,
      $9,$10,$11,$12,
      $13,$14,$15,
      $16,$17,
      $18,$19,
      $20,$21,$22,
      $23,$24,
      $25,$26,$27,$28,$29,
      $30,$31,
      $32,$33,$34,
      $35,$36,$37
    )
    `;

    // ✅ SAFE VALUES (NULL handling)
    if (body.mnc_data !== undefined) {
        if (typeof body.mnc_data === "object") {
            body.mnc_data = JSON.stringify(body.mnc_data); // object ya array dono handle
        } else {
            body.mnc_data = body.mnc_data || null;
        }
    }  
    if (body.wifi_data !== undefined) {
        if (typeof body.wifi_data === "object") {
            body.wifi_data = JSON.stringify(body.wifi_data); // object ya array dono
        } else {
            body.wifi_data = body.wifi_data || null;
        }
    }
    const values = [
      body.user_id,

      body.date ?? formattedDate,
      body.time_loc ?? formattedTime,
      body.location_type ?? null,

      body.latitude ?? null,
      body.latitude_rep ?? null,
      body.longitude ?? null,
      body.longitude_rep ?? null,

      body.speed ?? null,
      body.direction ?? null,
      body.altitude ?? null,
      body.satellites_no ?? null,

      body.gsm_signal_strength ?? null,
      body.battery ?? null,
      body.steps ?? null,

      body.terminal_status_hexadecimal ?? null,
      body.terminal_status ?? null,

      body.no_of_base_stations ?? null,
      body.connected_base_station ?? null,

      body.mcc_country_code ?? null,
      body.mnc_network_code ?? null,
      body.mnc_data ?? null,
      
      body.no_of_wifi ?? null,
      body.wifi_data ?? null,

      body.modify_at ?? modify_at,
      body.status ?? null,
      body.address ?? null,
      body.country ?? null,
      body.city ?? null,

      body.no_of_roll_overs ?? null,
      body.type_of_location ?? null,

      body.wb_date ?? null,
      body.wb_time ?? null,
      body.postdate_wb ?? null,

      body.manualUpdate ?? 0,
      body.wb_lat ?? null,
      body.wb_log ?? null,
    ];

    await pool.query(query, values);

    return res.status(200).json({
      status: true,
      message: "Location inserted successfully",
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message,
    });
  }
}