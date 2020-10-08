import * as open from "open";

const STAGE_RS_BASE_URL =
  "https://settings-writer.stage.mozaws.net/v1/admin/#/buckets/main-workspace/collections/";
const CREATE_NEW_PATH = "records/create";

export async function openRS(collection: string) {
  const url = STAGE_RS_BASE_URL + collection + "/" + CREATE_NEW_PATH;
  await open(url);
  return url;
}
