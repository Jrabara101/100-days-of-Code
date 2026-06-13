// --- STELLAR / SOROBAN INTEGRATION ---

const STELLAR_CONFIG = {
    networkPassphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    friendbotUrl: 'https://friendbot.stellar.org',
    contractId: 'CBXJGV4KEDN6WOBFU2P2J4MVSFS673ELQHXKB5RYMIGI3WWQ52O4J6D7',
};

class StellarWallet {
    constructor() {
        this.address = null;
        this.connected = false;
        this._sdk = null;
        this._kit = null;
    }

    async _getKit() {
        if (this._kit) return this._kit;
        const mod = await import('https://esm.sh/@creit.tech/stellar-wallets-kit@1?bundle');
        const { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } =
            mod.default ?? mod;

        this._kit = new StellarWalletsKit({
            network: WalletNetwork.TESTNET,
            selectedWalletId: FREIGHTER_ID,
            modules: allowAllModules(),
        });
        return this._kit;
    }

    async _getSDK() {
        if (this._sdk) return this._sdk;
        const mod = await import('https://esm.sh/@stellar/stellar-sdk@15');
        this._sdk = mod.default ?? mod;
        return this._sdk;
    }

    // Auto-fund any address that isn't activated on Testnet yet
    async _ensureFunded(address) {
        try {
            const res = await fetch(`${STELLAR_CONFIG.horizonUrl}/accounts/${address}`);
            if (res.status === 404) {
                this._showStatus('Funding your Testnet account...', 'info');
                await fetch(`${STELLAR_CONFIG.friendbotUrl}/?addr=${address}`);
                this._showStatus('Testnet account funded! Ready to play.', 'success');
            }
        } catch (e) {
            // Non-fatal — account may already exist
        }
    }

    async connect() {
        try {
            const kit = await this._getKit();

            await kit.openModal({
                onWalletSelected: async (option) => {
                    try {
                        kit.setWallet(option.id);
                        const { address } = await kit.getAddress();
                        if (!address) throw new Error('Could not retrieve wallet address.');

                        this.address = address;
                        this.connected = true;
                        this._updateWalletUI();
                        this._showStatus(`Wallet connected: ${this._short(address)}`, 'success');

                        // Auto-fund on Testnet if needed — works for any wallet
                        await this._ensureFunded(address);

                        // Show the wallet's XLM balance
                        await this._updateBalanceUI();
                    } catch (e) {
                        this._showStatus(`Connection failed: ${e.message}`, 'error');
                    }
                },
                onClosed: (err) => {
                    if (err) this._showStatus('Wallet selection cancelled.', 'info');
                },
            });
            return true;
        } catch (err) {
            this._showStatus(`Connection failed: ${err.message}`, 'error');
            return false;
        }
    }

    disconnect() {
        this.address = null;
        this.connected = false;
        this._updateWalletUI();
        this._updateBalanceUI();
        this._showStatus('Wallet disconnected.', 'info');
    }

    async submitScore(score, level) {
        if (!this.connected || !this.address) {
            this._showStatus('Connect your wallet first to save your score!', 'error');
            return false;
        }

        this._showStatus('Saving score to blockchain...', 'info');

        try {
            const sdk = await this._getSDK();
            const kit = await this._getKit();
            const rpc = new sdk.rpc.Server(STELLAR_CONFIG.rpcUrl);
            const contract = new sdk.Contract(STELLAR_CONFIG.contractId);

            // Ensure funded before attempting transaction
            await this._ensureFunded(this.address);

            const account = await rpc.getAccount(this.address);

            const args = [
                sdk.Address.fromString(this.address).toScVal(),
                sdk.nativeToScVal(score, { type: 'u32' }),
                sdk.nativeToScVal(level, { type: 'u32' }),
            ];

            let tx = new sdk.TransactionBuilder(account, {
                fee: sdk.BASE_FEE,
                networkPassphrase: STELLAR_CONFIG.networkPassphrase,
            })
                .addOperation(contract.call('submit_score', ...args))
                .setTimeout(180)
                .build();

            const sim = await rpc.simulateTransaction(tx);
            if (sdk.rpc.Api.isSimulationError(sim)) {
                throw new Error(`Simulation failed: ${sim.error}`);
            }

            tx = sdk.rpc.assembleTransaction(tx, sim).build();

            this._showStatus('Please approve in your wallet...', 'info');
            const { signedTxXdr } = await kit.signTransaction(tx.toXDR(), {
                address: this.address,
                networkPassphrase: STELLAR_CONFIG.networkPassphrase,
            });

            const signedTx = sdk.TransactionBuilder.fromXDR(
                signedTxXdr,
                STELLAR_CONFIG.networkPassphrase
            );
            const response = await rpc.sendTransaction(signedTx);

            if (response.status === 'ERROR') {
                throw new Error(`Transaction failed: ${response.errorResult}`);
            }

            let result = await rpc.getTransaction(response.hash);
            let attempts = 0;
            while (result.status === 'NOT_FOUND' && attempts < 20) {
                await new Promise(r => setTimeout(r, 1000));
                result = await rpc.getTransaction(response.hash);
                attempts++;
            }

            if (result.status === 'SUCCESS') {
                this._showStatus(`Score ${score} saved on-chain! Tx: ${this._short(response.hash)}`, 'success');
                this._updateBalanceUI(); // fees were spent — refresh
                return true;
            } else {
                throw new Error('Transaction not confirmed in time.');
            }
        } catch (err) {
            this._showStatus(`Failed to save score: ${err.message}`, 'error');
            return false;
        }
    }

    async fetchLeaderboard() {
        try {
            const sdk = await this._getSDK();
            const rpc = new sdk.rpc.Server(STELLAR_CONFIG.rpcUrl);
            const contract = new sdk.Contract(STELLAR_CONFIG.contractId);

            const tempKeypair = sdk.Keypair.random();
            const tempAccount = new sdk.Account(tempKeypair.publicKey(), '0');

            const tx = new sdk.TransactionBuilder(tempAccount, {
                fee: sdk.BASE_FEE,
                networkPassphrase: STELLAR_CONFIG.networkPassphrase,
            })
                .addOperation(contract.call('get_leaderboard'))
                .setTimeout(30)
                .build();

            const sim = await rpc.simulateTransaction(tx);
            if (sdk.rpc.Api.isSimulationError(sim)) return [];

            const raw = sim.result?.retval;
            if (!raw) return [];

            const entries = sdk.scValToNative(raw);
            return entries.map((e, i) => ({
                rank: i + 1,
                address: e.player.toString(),
                score: Number(e.score),
                level: Number(e.level),
            }));
        } catch (err) {
            console.error('Leaderboard fetch failed:', err);
            return [];
        }
    }

    // Fetch the connected wallet's native XLM balance from Horizon
    async fetchBalance() {
        if (!this.address) return null;
        try {
            const res = await fetch(`${STELLAR_CONFIG.horizonUrl}/accounts/${this.address}`);
            if (!res.ok) return '0';
            const data = await res.json();
            const native = data.balances?.find(b => b.asset_type === 'native');
            return native ? parseFloat(native.balance).toFixed(2) : '0';
        } catch (e) {
            return null;
        }
    }

    // Fetch the balance and render it into the wallet bar
    async _updateBalanceUI() {
        const balEl = document.getElementById('stellar-balance');
        if (!balEl) return;
        if (!this.connected) {
            balEl.textContent = '';
            return;
        }
        balEl.textContent = 'Balance: …';
        const balance = await this.fetchBalance();
        balEl.textContent = balance !== null ? `Balance: ${balance} XLM` : 'Balance: unavailable';
    }

    _short(address) {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    _showStatus(message, type = 'info') {
        const el = document.getElementById('stellar-status');
        if (!el) return;
        el.textContent = message;
        el.className = `stellar-status stellar-status--${type}`;
        el.style.display = 'block';
        if (type === 'success') {
            setTimeout(() => { el.style.display = 'none'; }, 4000);
        }
    }

    _updateWalletUI() {
        const btn = document.getElementById('stellar-connect-btn');
        const addressEl = document.getElementById('stellar-address');
        if (!btn) return;

        if (this.connected && this.address) {
            btn.textContent = 'Disconnect';
            btn.onclick = () => window.stellarWallet.disconnect();
            if (addressEl) addressEl.textContent = this._short(this.address);
        } else {
            btn.textContent = 'Connect Wallet';
            btn.onclick = () => window.stellarWallet.connect();
            if (addressEl) addressEl.textContent = 'Not connected';
        }
    }
}

const stellarWallet = new StellarWallet();
window.stellarWallet = stellarWallet;
