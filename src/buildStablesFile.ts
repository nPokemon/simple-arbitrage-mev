import { Contract } from 'ethers';

export async function buildStablecoinDataFile(tokenList: { symbol: string, address: string }[], bundle_executor_abi: any, provider: any) {
    const result: { [address: string]: { address: string, symbol: string, decimals: number } } = {};

    for (let i = 0; i < tokenList.length; i++) {
        try {
            const token = tokenList[i];
            const contract = new Contract(token.address, bundle_executor_abi, provider);
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();

            console.table([
                { name: 'Symbol', value: symbol },
                { name: 'Decimals', value: decimals }
            ]);

            result[token.address.toLowerCase()] = {
                address: token.address.toLowerCase(),
                symbol: token.symbol,
                decimals: decimals
            };
        } catch (error) {
            console.log(error);
        }
    }

    console.log(result);
    return result;
}