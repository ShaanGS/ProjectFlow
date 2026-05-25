import { HindsightClient } from "@vectorize-io/hindsight-client";
import { readFileSync } from "fs";

const incidents = JSON.parse(readFileSync("./data/incidents.json", "utf-8"));
const client = new HindsightClient({
  baseUrl: "https://api.hindsight.vectorize.io",
  apiKey: "dummy_keys",
});

async function run() {
  try {
    const results = await client.recall("kairo", "test checkout", { budget: "low", tags: ["kairo"] });
    
    const hydratedMatches = (results.results ?? []).map((m) => {
      let incident = null;
      if (m.context) {
        const cleanContext = m.context.replace("Post-mortem experience: ", "").trim();
        incident = incidents.find((inc) => inc.title.includes(cleanContext) || cleanContext.includes(inc.title));
      }
      if (!incident && m.text) {
        const text = m.text.toLowerCase();
        const words = text.split(/\\W+/).filter(w => w.length > 3);
        let bestScore = 0;
        for (const inc of incidents) {
          const incText = (inc.title + " " + inc.embedding_text + " " + inc.symptoms.join(" ") + " " + inc.actual_root_cause + " " + inc.successful_fix).toLowerCase();
          let score = 0;
          for (const w of words) {
            if (incText.includes(w)) score++;
          }
          if (score > bestScore) {
            bestScore = score;
            incident = inc;
          }
        }
      }

      const metadata = m.metadata || {
        incident_id: incident?.incident_id,
        title: incident?.title ?? m.context ?? "untitled",
        vendor: incident?.vendor ?? "internal",
        region: incident?.region ?? "unknown",
        classification: incident?.classification ?? "unknown",
        actual_root_cause: incident?.actual_root_cause ?? "",
        successful_fix: incident?.successful_fix ?? "",
        failed_checks: incident ? incident.failed_checks.join(", ") : "",
        time_to_resolution_minutes: incident ? String(incident.time_to_resolution_minutes) : "0",
        timestamp_start: incident?.timestamp_start ?? m.occurred_start ?? m.mentioned_at ?? "?",
        customer_impact: incident?.customer_impact ?? "unknown",
      };

      return { ...m, metadata };
    });

    console.log(JSON.stringify(hydratedMatches.map(m => m.metadata.title), null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
