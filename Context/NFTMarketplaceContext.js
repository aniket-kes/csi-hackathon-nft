import React, { useState, useContext, useEffect } from "react";
import web3modal from "web3modal";
import { ethers } from "ethers";
// import NFTMarketPlace from '../artifacts/contracts/NFTMarketPlace.sol/NFTMarketPlace.json';
import Router from "next/router";

import axios from "axios";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { NFTMarketplaceAddress, NFTMarketplaceABI } from "./constants";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

//fetching contract
const fetchContract = (signerOrProvider) =>
  new ethers.Contract(
    NFTMarketplaceAddress,
    NFTMarketplaceABI,
    signerOrProvider
  );
// console.log(fetchContract);

const connectingWithSmartContract = async () => {
  try {
    const web3Modal = new web3modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = fetchContract(signer);
    return contract;
  } catch (error) {
    console.log(
      "Something went wrong while connecting with smart contract. Please try again later."
    );
  }
};

export const NFTMarketplaceContext = React.createContext();

export const NFTMarketplaceProvider = ({ children }) => {
  const title = "Discover ";
  const [currentAccount, setCurrentAccount] = useState("");
  // const[loading, setLoading] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        console.log("Make sure you have metamask!");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setCurrentAccount(accounts[3]);
        // console.log(accounts[0]);
      } else {
        setError("No Account Found");
        setOpenError(true);
      }

      // console.log(currentAccount);
    } catch (error) {
      console.log(
        "Something went wrong while checking if wallet is connected. Please try again later."
      );
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        return console.log("Install MetaMask");
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[3]);
      // window.location.reload();
    } catch (error) {
      console.log("Error while connecting to wallet");
    }
  };

  const uploadToPinata = async (file) => {
    if(file){
        try{
            const formData = new FormData();
            formData.append("file", file);

            const response = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers:{
                    pinata_api_key: `020cc455430e8d3978d9`,
                    pinata_secret_api_key:`49fa357c356bc6e50b09a7fc7f7fe28ba412806509993e03ebef1d13ddfb2c9c`,
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log(response);
            const ImgHash = `https://gateway.mypinata.cloud/ipfs/${response.data.IpfsHash}`;

            console.log(ImgHash);
            return ImgHash;
        }
        catch(error){
            console.log("Error while uploading to pinata");
        }
    }
    };

  const createNFT = async (name, price, image, description, royalties, fileSize, category, price) => {
    // const { name, description, price } = formInput;

    if (!name || !description || !price || !image) {
      return console.log("Data is missing ");
    }

    const data = JSON.stringify({ name, description, image: fileUrl });

    try {
      const response = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: data,
        headers:{
            pinata_api_key: `020cc455430e8d3978d9`,
            pinata_secret_api_key:`49fa357c356bc6e50b09a7fc7f7fe28ba412806509993e03ebef1d13ddfb2c9c`,
            "Content-Type": "multipart/form-data",
        },
        
      })
    //   const added = await client.add(data);
      const url = `http://gateway.mypinata.cloud/ipfs${response.data.IpfsHash}`;

      await createSale(url, price);
    } catch (error) {
      console.log("Error while creating NFT");
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    try {
      const price = ethers.utils.parseUnits(formInputPrice, "ether");
      const contract = await connectingWithSmartContract();
      const listingPrice = await contract.getListingPrice();
      const transaction = !isReselling
        ? await contract.createToken(url, price, {
            value: listingPrice.toString(),
          })
        : await contract.reSellToken(url, price, {
            value: listingPrice.toString(),
          });
      await transaction.wait();
    } catch (error) {
      console.log("Error while creating sale");
    }
  };

  const fetchNFTs = async () => {
    try {
      const provider = new ethers.providers.JsonRpcBatchProvider();
      const contract = fetchContract(provider);
      const data = await contract.fetchMarketItems();
      const items = await Promise.all(
        data.map(
          async ({ tokenId, seller, owner, price: unformattedPrice }) => {
            const tokenURI = await category.tokenURI(tokenId);
            const {
              data: { image, name, description },
            } = await axios.get(tokenURI);
            const price = ethers.utils.formatUnits(
              unformattedPrice.toString(),
              "ether"
            );

            return {
              price,
              tokenId: tokenId.toNumber(),
              seller,
              owner,
              image,
              name,
              description,
              tokenURI,
            };
          }
        )
      );

      return items;
    } catch (error) {
      console.log("Error while fetching NFTS");
    }
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    try {
      if (currentAccount) {
        const contract = await connectingWithSmartContract();

        const data =
          type == "fetchItemsListed"
            ? await contract.fetchItemsListed()
            : await contract.fetchMyNFT();

        const items = await Promise.all(
          data.map(
            async ({ tokenId, seller, owner, price: unformattedPrice }) => {
              const tokenURI = await contract.tokenURI(tokenId);
              const {
                data: { image, name, description },
              } = await axios.get(tokenURI);
              const price = ethers.utils.formatUnits(
                unformattedPrice.toString(),
                "ether"
              );

              return {
                price,
                tokenId: tokenId.toNumber(),
                seller,
                owner,
                image,
                name,
                description,
                tokenURI,
              };
            }
          )
        );
        return items;
      }
    } catch (error) {
      setError("Error while fetching listed NFTs");
      setOpenError(true);
    }
  };

  const buyNFT = async (nft) => {
    try {
      const contract = await connectingWithSmartContract();
      const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

      const transaction = await contract.createMarketSale(nft.tokenId, {
        value: price,
      });

      await transaction.wait();
      //   router.push("/author");
    } catch (error) {
      setError("Error While buying NFT");
      setOpenError(true);
    }
  };

  return (
    <NFTMarketplaceContext.Provider
      value={{
        checkIfWalletIsConnected,
        connectWallet,
        uploadToPinata,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        currentAccount,
        title,
      }}
    >
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
