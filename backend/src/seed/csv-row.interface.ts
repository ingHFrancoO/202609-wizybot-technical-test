/** Raw row as parsed from products_list.csv — every field arrives as a string. */
export interface ProductCsvRow {
  displayTitle: string;
  embeddingText: string;
  url: string;
  imageUrl: string;
  productType: string;
  discount: string;
  price: string;
  variants: string;
  createDate: string;
}
