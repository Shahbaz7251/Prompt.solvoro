export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/enhance") {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const { prompt } = await request.json();

      if (!prompt) {
        return new Response(JSON.stringify({ error: "No prompt provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://prompt-enhancer.pages.dev", // Optional, helps with OpenRouter analytics
            "X-Title": "Prompt Enhancer",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        return new Response(
          JSON.stringify({
            error: data.error.message || "OpenRouter API error",
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const aiResponse = data.choices[0].message.content;

      return new Response(aiResponse, {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          details: err.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};
