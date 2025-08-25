import { Client } from "@notionhq/client";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function testNotionQuery(): Promise<void> {
  console.log(
    "🧪 Testing Notion query for ready entries with MIDI and PDF links..."
  );

  if (!NOTION_TOKEN) {
    console.error("❌ NOTION_TOKEN environment variable is required");
    process.exit(1);
  }

  if (!NOTION_DATABASE_ID) {
    console.error("❌ NOTION_DATABASE_ID environment variable is required");
    process.exit(1);
  }

  try {
    const client = new Client({ auth: NOTION_TOKEN });
    console.log(`📋 Database ID: ${NOTION_DATABASE_ID}`);

    // Query for entries with Status = "Ready"
    const response = await client.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: "Status",
        select: {
          equals: "Ready",
        },
      },
      sorts: [
        {
          property: "Name",
          direction: "ascending",
        },
      ],
    });

    console.log(
      `✅ Found ${response.results.length} entries with "Ready" status`
    );

    // Filter entries that have both MIDI Link and PDF Link
    const entriesWithLinks = response.results.filter((page) => {
      if (!("properties" in page)) return false;

      const props = page.properties;

      // Check MIDI Link
      const midiLink = props["MIDI Link"];
      const hasMidiLink =
        midiLink &&
        "rich_text" in midiLink &&
        Array.isArray(midiLink.rich_text) &&
        midiLink.rich_text.length > 0 &&
        midiLink.rich_text.some(
          (t) =>
            t &&
            typeof t === "object" &&
            "plain_text" in t &&
            t.plain_text.trim() !== ""
        );

      // Check PDF Link
      const pdfLink = props["PDF Link"];
      const hasPdfLink =
        pdfLink &&
        "rich_text" in pdfLink &&
        Array.isArray(pdfLink.rich_text) &&
        pdfLink.rich_text.length > 0 &&
        pdfLink.rich_text.some(
          (t) =>
            t &&
            typeof t === "object" &&
            "plain_text" in t &&
            t.plain_text.trim() !== ""
        );

      return hasMidiLink && hasPdfLink;
    });

    console.log(
      `🎯 Found ${entriesWithLinks.length} ready entries with both MIDI and PDF links`
    );

    if (entriesWithLinks.length > 0) {
      console.log("\n📋 Ready entries with MIDI and PDF links:");
      console.log("=".repeat(80));

      entriesWithLinks.forEach((page, index) => {
        if ("properties" in page) {
          const props = page.properties;

          // Extract data
          const name =
            props.Name && "title" in props.Name
              ? props.Name.title
                  .map((t: { plain_text: string }) => t.plain_text)
                  .join("")
              : "N/A";

          const author =
            props.Author && "rich_text" in props.Author
              ? props.Author.rich_text
                  .map((t: { plain_text: string }) => t.plain_text)
                  .join("")
              : "N/A";

          const type =
            props.Type &&
            "select" in props.Type &&
            props.Type.select &&
            "name" in props.Type.select
              ? props.Type.select.name
              : "N/A";

          const difficulty =
            props.Difficulty &&
            "select" in props.Difficulty &&
            props.Difficulty.select &&
            "name" in props.Difficulty.select
              ? props.Difficulty.select.name
              : "N/A";

          const key =
            props.Key &&
            "select" in props.Key &&
            props.Key.select &&
            "name" in props.Key.select
              ? props.Key.select.name
              : "N/A";

          const midiLink =
            props["MIDI Link"] && "rich_text" in props["MIDI Link"]
              ? props["MIDI Link"].rich_text
                  .map((t: { plain_text: string }) => t.plain_text)
                  .join("")
              : "N/A";

          const pdfLink =
            props["PDF Link"] && "rich_text" in props["PDF Link"]
              ? props["PDF Link"].rich_text
                  .map((t: { plain_text: string }) => t.plain_text)
                  .join("")
              : "N/A";

          const videoLink =
            props["Video Link"] &&
            "url" in props["Video Link"] &&
            props["Video Link"].url
              ? props["Video Link"].url
              : "N/A";

          console.log(`\n${index + 1}. ${name}`);
          console.log(`   📝 Author: ${author}`);
          console.log(`   🎵 Type: ${type}`);
          console.log(`   📊 Difficulty: ${difficulty}`);
          console.log(`   🎼 Key: ${key}`);
          console.log(`   🎹 MIDI Link: ${midiLink}`);
          console.log(`   📄 PDF Link: ${pdfLink}`);
          console.log(`   🎥 Video Link: ${videoLink as string}`);
          console.log(`   🆔 Page ID: ${page.id}`);
        }
      });

      console.log(`\n${"=".repeat(80)}`);
      console.log(
        `✅ Summary: ${entriesWithLinks.length} entries ready for processing`
      );
    } else {
      console.log("\n ℹ️  No ready entries found with both MIDI and PDF links");
      console.log("\n🔍 Checking what Ready entries exist...");

      if (response.results.length > 0) {
        response.results.forEach((page, index) => {
          if ("properties" in page) {
            const props = page.properties;
            const name =
              props.Name && "title" in props.Name
                ? props.Name.title
                    .map((t: { plain_text: string }) => t.plain_text)
                    .join("")
                : "N/A";

            const midiLink =
              props["MIDI Link"] && "rich_text" in props["MIDI Link"]
                ? props["MIDI Link"].rich_text
                    .map((t: { plain_text: string }) => t.plain_text)
                    .join("")
                    .trim()
                : "";

            const pdfLink =
              props["PDF Link"] && "rich_text" in props["PDF Link"]
                ? props["PDF Link"].rich_text
                    .map((t: { plain_text: string }) => t.plain_text)
                    .join("")
                    .trim()
                : "";

            console.log(`\n${index + 1}. ${name}`);
            console.log(`   🎹 MIDI: ${midiLink || "❌ Empty"}`);
            console.log(`   📄 PDF: ${pdfLink || "❌ Empty"}`);
          }
        });
      }
    }

    console.log("\n🎉 Notion query test completed successfully!");
  } catch (error) {
    console.error("❌ Notion query test failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    process.exit(1);
  }
}

void testNotionQuery();
