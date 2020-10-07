import fetch from "node-fetch";

const PRODUCT_DETAILS_URL =
  "https://product-details.mozilla.org/1.0/firefox_versions.json";

export async function getFirefoxDesktopReleases() {
  const {
    LATEST_FIREFOX_VERSION,
    FIREFOX_DEVEDITION,
    FIREFOX_NIGHTLY,
    NEXT_RELEASE_DATE,
  } = await (await fetch(PRODUCT_DETAILS_URL)).json();

  return [
    {
      name: `Current Release (${LATEST_FIREFOX_VERSION})`,
      value: LATEST_FIREFOX_VERSION,
    },
    {
      name: `Current Beta (${FIREFOX_DEVEDITION}, live on ${NEXT_RELEASE_DATE})`,
      value: FIREFOX_DEVEDITION,
    },
    {
      name: `Current Nightly (${FIREFOX_NIGHTLY})`,
      value: FIREFOX_NIGHTLY,
    },
    {
      name: "Other",
      value: "",
    },
  ];
}
