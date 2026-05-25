import { HindsightClient } from "@vectorize-io/hindsight-client";

const client = new HindsightClient({
  baseUrl: "https://api.hindsight.vectorize.io",
  apiKey: "dummy_keys",
});

async function run() {
  try {
    const models = await client.listMentalModels("kairo");
    console.log("Response:", JSON.stringify(models, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
