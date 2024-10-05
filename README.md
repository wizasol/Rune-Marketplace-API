
# Rune Marketplace API

The Rune Guardian's Rune marketplace api backend is a Node.js project providing RESTful API endpoints for managing marketplace listings and offers using MongoDB. This project integrates essential middleware, environment variable configurations, and includes detailed API documentation via Swagger UI.

<h4> 📞 Cᴏɴᴛᴀᴄᴛ ᴍᴇ Oɴ ʜᴇʀᴇ: 👆🏻 </h4>

<p> 
    <a href="mailto:nakao95911@gmail.com" target="_blank">
        <img alt="Email"
        src="https://img.shields.io/badge/Email-00599c?style=for-the-badge&logo=gmail&logoColor=white"/>
    </a>
     <a href="https://x.com/_wizardev" target="_blank"><img alt="Twitter"
        src="https://img.shields.io/badge/Twitter-000000?style=for-the-badge&logo=x&logoColor=white"/></a>
    <a href="https://discordapp.com/users/471524111512764447" target="_blank"><img alt="Discord"
        src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white"/></a>
    <a href="https://t.me/wizardev" target="_blank"><img alt="Telegram"
        src="https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white"/></a>
</p>

## Table of Contents
- [Configuration](#configuration)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [MongoDB Schema](#mongodb-schema)
- [Swagger Documentation](#swagger-documentation)
- [Contributing](#contributing)
- [License](#license)

## Configuration
Configuration settings are sourced from a `.env` file and a config module. Ensure you have the necessary environment variables set up in your `.env` file.

## Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/asseph/rune-marketplace-apis.git
    cd rune-marketplace-apis
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Create an `.env` file and add your environment variables:
    ```plaintext
    NETWORKTYPE=TESTNET
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/trg-runemarket
    ```
    You can reference .env.example file configuration.

4. Start the server:
    ```bash
    npm start
    ```

## Usage
After starting the server, the application will be running on the specified port. By default, it is set to port 3000. You can access the backend running status at `http://localhost:3000` and see the Swagger API documentation at `http://localhost:3000/api-docs`.

## API Endpoints
The following routes are available in the application:
- `POST /api/create-listing`: Create a new listing.
- `POST /api/save-listing`: Save listing data.
- `DELETE /api/delete-listing`: Delete an existing listing.
- `PUT /api/update-listing`: Update an existing listing.
- `POST /api/create-offer`: Create a new offer for a listing.
- `POST /api/submit-offer`: Submit an offer for a listing.

## MongoDB Schema
The MongoDB schema used in this project is as follows:

```javascript
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  ordinalId: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  sellerPaymentAddress: { type: String, required: true },
  sellerOrdinalPublicKey: { type: String, required: true },
  status: { type: String, required: true },
  ordinalUtxoTxId: { type: String, required: true },
  ordinalUtxoVout: { type: Number, requred: true },
  serviceFee: { type: Number },
  signedListingPSBT: { type: String, required: true },
});

const OrderModel = mongoose.model("order", OrderSchema);

export default OrderModel;
```

## Swagger Documentation
Swagger UI is integrated to provide an interactive API documentation. You can access it at `http://localhost:3000/api-docs`. This documentation will dynamically reflect the API endpoints of the application.

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am "Add new feature"`).
4. Push your branch (`git push origin feature-branch`).
5. Create a new Pull Request.

## License
This project is licensed under the MIT License.

## Additional Informations
## Tags

- **Listing:** Operations related to managing listings on the marketplace
- **Offer:** Operations related to making offers and purchasing ordinals

## Endpoints

### Create Listing

- **Endpoint:** `/create-listing`
- **Method:** POST
- **Summary:** This endpoint lists one or more ordinals for sale on the marketplace.
- **Description:** This endpoint is used to list ordinals for sale. It returns a Partially Signed Bitcoin Transaction (PSBT) which the owner must sign. The buyer must provide the unspent transaction output (UTXO) covering the price and fees, with the seller's signature required only during the initial listing.
- **RequestBody:**
  - **Content Type:** `application/json`
  - **Schema:** `CreateListing`
- **Responses:**
  - **200:** Create Listing Success!
  - **500:** Create Listing failed!

### Save Listing

- **Endpoint:** `/save-listing`
- **Method:** POST
- **Summary:** Save listing is part of the create listing process.
- **Description:** After receiving a PSBT from the `create-listing` endpoint, this signed PSBT must be saved in the listing database through this endpoint.
- **RequestBody:**
  - **Content Type:** `application/json`
  - **Schema:** `SaveListing`
- **Responses:**
  - **200:** Save Listing Success!
  - **500:** Save Listing failed!

### Relist

- **Endpoint:** `/relist`
- **Method:** POST
- **Summary:** Update an existing marketplace listing with a new price.
- **Description:** This endpoint updates an existing listing with a new price and returns a PSBT needing the seller's signature. The signed PSBT must be confirmed via `/marketplace/confirm-relist` for the changes to take effect.
- **RequestBody:**
  - **Content Type:** `application/json`
  - **Schema:** `UpdateListing`
- **Responses:**
  - **200:** Update Listing Request Success!
  - **500:** Update Listing Request failed!

### Confirm Relist

- **Endpoint:** `/confirm-relist`
- **Method:** POST
- **Summary:** Confirm the updated marketplace listing.
- **Description:** Confirms the price update to an existing listing. Returns a PSBT which must be signed and returned to `/marketplace/confirm-relist`.
- **RequestBody:**
  - **Content Type:** `application/json`
  - **Schema:** `ConfirmUpdateListing`
- **Responses:**
  - **200:** Delete Listing Success!
  - **500:** Delete Listing failed!

### Delist

- **Endpoint:** `/delist`
- **Method:** POST
- **Summary:** Delete an existing marketplace listing.
- **Description:** Deletes an ordinal listing from the marketplace. The process involves creating and signing a transaction, which is then confirmed via `/confirm-delist` to transfer the ordinal back to the seller.
- **RequestBody:**
  - **Content Type:** `application/json`
  - **Schema:** `DeleteListing`
- **Responses:**
  - **200:** Update Listing Success!
  - **500:** Update Listing failed!

### Create Offer

- **Endpoint:** `/create-offer`
- **Method:** POST
- **Summary:** Create a transaction to purchase an ordinal listed for sale.
- **Description:** Generates a PSBT to be signed by the potential buyer. A platform fee of 1% is applied only upon the sale.
- **RequestBody:**
  - **Content Type:** `application/json`
  - **Schema:** `CreateOffer`
- **Responses:**
  - **200:** Create Offer Success!
  - **500:** Create Offer failed!

### Submit Offer

- **Endpoint:** `/submit-offer`
- **Method:** POST
- **Summary:** Complete the purchase of an ordinal.
- **Description:** Submits a signed PSBT to complete the purchase. A platform fee of 1% is applied to the seller upon a successful sale.
- **RequestBody:**
  - **Content Type:** `application/json`
  - **Schema:** `SubmitOffer`
- **Responses:**
  - **200:** Submit Offer Success!
  - **500:** Submit Offer failed!
