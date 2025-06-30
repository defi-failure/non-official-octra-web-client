# octra web client (NOT official)

**NOTE**: This is **NOT** an official client.

This is a simple web client for [Octra](https://octra.org/), made for users who are having difficulty with the **OFFICIAL** [TUI (text-based user interface) client](https://github.com/octra-labs/octra_pre_client).

![login-page](./images/login-page.png)
![dashboard-page](./images/dashboard-page.png)

## Usage

If you don't have an Octra wallet yet, you can generate one using the official wallet generator at [here](https://github.com/octra-labs/wallet-gen).

Then you can start your own development server:

```bash
npm install
npm run dev
```

Or, you can deploy it directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdefi-failure%2Fnon-official-octra-web-client)


Or, use the deployed client [here](https://non-official-octra-web-client.vercel.app).


## TODO
- [x] support multi send
- [x] support staging transaction history
- [ ] support transaction history pagination (api doesn’t seem to support this yet, will try later)
- [x] maybe support wallet generation?

