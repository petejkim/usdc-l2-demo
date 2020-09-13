import BN from "bn.js";
import React, { useCallback, useState } from "react";
import Web3 from "web3";
import spinner from "../images/spinner.svg";
import { bnFromDecimalString, strip0x } from "../util/types";
import { Button } from "./Button";
import { HintBubble } from "./HintBubble";
import { TextField } from "./TextField";
import "./TransferToken.scss";

const TRANSFER_SELECTOR = "0xa9059cbb";

export interface TransferTokenProps {
  web3: Web3 | null;
  userAddress: string;
  contractAddress: string;
  balance: BN | null;
  decimalPlaces: number;
  gasRelayUrl?: string;
}

export function TransferToken(props: TransferTokenProps): JSX.Element {
  const {
    web3,
    userAddress,
    contractAddress,
    balance,
    decimalPlaces,
    gasRelayUrl,
  } = props;

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [signing, setSigning] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const changeAmount = useCallback((v: string) => {
    setAmount(v.replace(/[^\d.]/g, "") || "");
  }, []);

  const parsedAmount = bnFromDecimalString(amount, decimalPlaces);

  const sendTokens = useCallback(() => {
    if (!web3 || !parsedAmount) {
      return;
    }
    if (!gasRelayUrl) {
      performTransfer({
        from: userAddress,
        to: recipient,
        amount: parsedAmount,
        contractAddress,
        web3,
        setSigning,
        setSending,
      });
    }
  }, [
    web3,
    userAddress,
    contractAddress,
    gasRelayUrl,
    parsedAmount,
    recipient,
  ]);

  const recipientValid = Web3.utils.isAddress(recipient);
  const amountValid = !!parsedAmount;
  const amountTooBig = !!(balance && parsedAmount?.gt(balance));
  const disableSend =
    !recipient ||
    !recipientValid ||
    !amount ||
    !amountValid ||
    amountTooBig ||
    signing ||
    sending;

  return (
    <div className="TransferToken">
      <div className="TransferToken-recipient-field">
        <TextField
          value={recipient}
          placeholder="Recipient address (0x1234...)"
          onChange={setRecipient}
        />
        {recipient && !recipientValid && (
          <HintBubble>Address entered is invalid.</HintBubble>
        )}
      </div>
      <div className="TransferToken-second-row">
        <div className="TransferToken-amount-field">
          <TextField
            value={amount}
            placeholder="Amount (12.34)"
            onChange={changeAmount}
          />
          {amount && !amountValid && (
            <HintBubble>Amount entered is invalid.</HintBubble>
          )}
          {amount && amountTooBig && (
            <HintBubble>
              Amount entered is greater than current balance.
            </HintBubble>
          )}
        </div>
        {sending && (
          <img className="TransferToken-spinner" src={spinner} alt="" />
        )}
        <Button disabled={disableSend} onClick={sendTokens}>
          {signing ? "Confirming..." : sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

function performTransfer(options: {
  from: string;
  to: string;
  amount: BN;
  contractAddress: string;
  web3: Web3;
  setSigning: (signing: boolean) => void;
  setSending: (sending: boolean) => void;
}): void {
  const {
    from,
    to,
    amount,
    contractAddress,
    web3,
    setSigning,
    setSending,
  } = options;

  setSigning(true);

  web3.eth
    .sendTransaction({
      from,
      to: contractAddress,
      data:
        TRANSFER_SELECTOR +
        strip0x(
          web3.eth.abi.encodeParameters(["address", "uint256"], [to, amount])
        ),
    })
    .on("transactionHash", (_txHash) => {
      setSigning(false);
      setSending(true);
    })
    .finally(() => {
      setSigning(false);
      setSending(false);
    });
}
