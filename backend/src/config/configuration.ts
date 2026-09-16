export interface AppConfig {
  port: number;
  openai: {
    apiKey: string;
    model: string;
  };
  openExchangeRates: {
    appId: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  csvProductsPath: string;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
  openExchangeRates: {
    appId: process.env.OPEN_EXCHANGE_RATES_APP_ID ?? '',
  },
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? '',
    password: process.env.DATABASE_PASSWORD ?? '',
    name: process.env.DATABASE_NAME ?? '',
  },
  csvProductsPath: process.env.CSV_PRODUCTS_PATH ?? './data/products_list.csv',
});
