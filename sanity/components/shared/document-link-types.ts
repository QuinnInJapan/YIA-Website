export interface DocumentLinkItem {
  _key: string;
  _type?: "documentLink";
  label?: { _key: string; value: string }[];
  file?: { asset?: { _ref: string } };
  url?: string;
  type?: string;
  fileType?: string;
}
