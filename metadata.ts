import express from 'express';
import bodyParser from 'body-parser';
import { PinataSDK } from "pinata-web3";


const pinata = new PinataSDK({
    pinataJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5ZDU2NDVlZi03MGU5LTQxZmQtODg5MC00NTNmMTEwOWUyYWMiLCJlbWFpbCI6ImxlaG9uZ3ZpMTl4QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI4ODk0M2EzYjUzYWIxNjhlMWU2ZCIsInNjb3BlZEtleVNlY3JldCI6ImRlOGIxOTdlMGZhYTYyODQ4Yzk0NGQ4YTJjNTQwYTcwMDNiZDJjMzlmOWU4OGM2ZWE3OTM4YjgyZWQyMWU2YjciLCJleHAiOjE3NTc5NzgyNzh9.- kfS - A4i8Suq_6InKHdlj1tBWjSXsYRUxRGRCihxcWE",
    pinataGateway: "example-gateway.mypinata.cloud",
});

const app = express();
app.use(bodyParser.json());

app.post('/upload', async (req, res) => {
    try {
        const { body } = req;

        const result = await pinata.pinJSONToIPFS(body);
        return res.status(200).json({
            message: 'Successfully uploaded to IPFS',
            ipfsHash: result.IpfsHash
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error uploading to IPFS',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
