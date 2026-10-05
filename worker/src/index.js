const DEFAULT_MODEL = "gemini-3.8-flash";

function headers(origin, allowed) {
  const ok = origin && origin === allowed;
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": ok ? origin : allowed,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}

function json(data, status, origin, allowed) {
  return new Response(JSON.stringify(data), { status, headers: headers(origin, allowed) });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "https://ayoaxely-max.github.io";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (origin && origin !== allowed) return json({ ok:false, error:"origin_not_allowed" }, 403, origin, allowed);
      return new Response(null, { status:204, headers:headers(origin, allowed) });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        ok:true,
        service:"kaloriku-ai",
        model:env.GEMINI_MODEL || DEFAULT_MODEL,
        geminiConfigured:Boolean(env.GEMINI_API_KEY)
      }, 200, origin, allowed);
    }

    if (url.pathname !== "/analyze" || request.method !== "POST") {
      return json({ ok:false, error:"not_found" }, 404, origin, allowed);
    }

    if (origin && origin !== allowed) {
      return json({ ok:false, error:"origin_not_allowed" }, 403, origin, allowed);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ ok:false, error:"gemini_not_configured" }, 503, origin, allowed);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ ok:false, error:"invalid_json" }, 400, origin, allowed); }

    const imageBase64 = String(body.imageBase64 || "");
    const mimeType = String(body.mimeType || "image/jpeg");
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mimeType)) {
      return json({ ok:false, error:"unsupported_image_type" }, 400, origin, allowed);
    }
    if (!imageBase64 || imageBase64.length > 8_000_000) {
      return json({ ok:false, error:"image_missing_or_too_large" }, 413, origin, allowed);
    }

    const schema = {
      type:"OBJECT",
      properties:{
        meal_description:{type:"STRING"},
        foods:{
          type:"ARRAY",
          items:{
            type:"OBJECT",
            properties:{
              name:{type:"STRING"},
              estimated_grams:{type:"NUMBER"},
              min_grams:{type:"NUMBER"},
              max_grams:{type:"NUMBER"},
              confidence:{type:"NUMBER"},
              portion_description:{type:"STRING"},
              visual_basis:{type:"STRING"}
            },
            required:["name","estimated_grams","min_grams","max_grams","confidence","portion_description"]
          }
        }
      },
      required:["foods"]
    };

    const prompt = [
      "Analisis foto makanan ini untuk pencatatan kalori.",
      "Identifikasi setiap komponen makanan/minuman yang terlihat secara terpisah.",
      "Gunakan nama makanan Bahasa Indonesia yang umum dipakai dalam database pangan Indonesia.",
      "Perkirakan berat bagian yang dimakan dalam gram serta rentang minimum dan maksimum yang realistis.",
      "confidence harus 0 sampai 1.",
      "Jangan menghitung kalori.",
      "Jangan menyatakan berat sebagai pasti.",
      "Jika minyak, saus, santan, sambal, atau topping terlihat signifikan, jadikan komponen terpisah.",
      "Jika tidak jelas, turunkan confidence.",
      "Kembalikan JSON sesuai schema."
    ].join(" ");

    const model = env.GEMINI_MODEL || DEFAULT_MODEL;
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
    const payload = {
      contents:[{ role:"user", parts:[
        { text:prompt },
        { inline_data:{ mime_type:mimeType, data:imageBase64 } }
      ]}],
      generationConfig:{
        responseMimeType:"application/json",
        responseSchema:schema,
        temperature:0.2
      }
    };

    let response;
    try {
      response = await fetch(endpoint, {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-goog-api-key":env.GEMINI_API_KEY
        },
        body:JSON.stringify(payload)
      });
    } catch {
      return json({ ok:false, error:"gemini_network_error" }, 502, origin, allowed);
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0,500);
      return json({ ok:false, error:"gemini_error", status:response.status, detail }, 502, origin, allowed);
    }

    const raw = await response.json();
    const text = raw.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    if (!text) return json({ ok:false, error:"empty_model_response" }, 502, origin, allowed);

    try {
      const result = JSON.parse(text);
      return json({ ok:true, model, result }, 200, origin, allowed);
    } catch {
      return json({ ok:false, error:"invalid_model_json", detail:text.slice(0,500) }, 502, origin, allowed);
    }
  }
};