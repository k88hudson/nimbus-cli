import * as open from "open";

const STAGE_RS_BASE_URL =
  "https://settings-writer.stage.mozaws.net/v1/admin/#/buckets/main-workspace/collections/";
const CREATE_NEW_PATH = "records/create";
const DESKTOP_RS_BUCKET = "nimbus-desktop-experiments";

export async function openRS() {
  const url = STAGE_RS_BASE_URL + DESKTOP_RS_BUCKET + "/" + CREATE_NEW_PATH;
  await open(url);
  return url;
}
