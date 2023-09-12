# vcc-trade #

Proof of concept for [ventureclub.club] peer-to-peer trading on [Urbit]

## Build/Develop ##

All commands assume that the current working directory is this repository's
base directory and use [durploy] to streamline various Urbit development
workflows.

### First-time Setup ###

The following commands should be executed after each fresh clone of the project
to set up the [Vite] and the UI development environment:

```bash
nvm install 16
nvm use 16

cd ./ui
yarn install

echo "VITE_SHIP_URL=http://127.0.0.1:8080" > .env.local
echo "VITE_ETHRPC_URL=https://eth-goerli.alchemyapi.io/v2/$ALCHEMY_GOERLI_APIKEY" >> .env.local
echo "VITE_RARIBLE_KEY=$RARIBLE_APIKEY" >> .env.local
echo "VITE_WALLET_KEY=$ETH_WALLET_PRIKEY" >> .env.local
```

Subsequently, run the following commands to download [durploy] create a new
[fake `~zod`][fakezod] with the `%vcc-trade` desk:

```bash
curl -LO https://raw.githubusercontent.com/sidnym-ladrut/durploy/release/durploy
chmod u+x ./durploy
./durploy ship zod
# In a different terminal:
./durploy desk zod vcc-trade ./desk/full/
```

### Development Workflows ###

#### Back-end Workflows ####

In order to continuously test back-end code changes as they're made, run the
following commands:

```bash
./durploy desk -w zod vcc-trade ./desk/full/
```

#### Front-end Workflows ####

In order to continuously test front-end code changes as they're made, run the
following commands:

```bash
cd ./ui
npm run dev
```

Also, be sure to authenticate via both the NPM web portal (default:
`127.0.0.1:3000`) and the development ship's web portal ([fake `~zod`][fakezod]
default: `127.0.0.1:8080`) using the output of the Urbit `+code` command as
the password.

### Deployment Workflow ###

#### Back-end Workflows ####

To generate a new full desk from the existing base desk, run all
of the following commands:

```bash
cd ./desk
rm -rI full/
find bare -type f | while read f; do { d=$(dirname "$f" | sed "s/^bare/full/"); mkdir -p "$d"; ln -sr -t "$d" "$f"; }; done
git clone -b urbit-os-v2.142-hotfix2 --depth 1 https://github.com/urbit/urbit.git urb
cp urb/pkg/arvo/mar/{bill*,hoon*,json*,kelvin*,mime*,noun*,ship*,txt*} full/mar/
cp urb/pkg/arvo/lib/{agentio*,dbug*,default-agent*,skeleton*,verb*} full/lib/
cp urb/pkg/arvo/sur/verb.hoon full/sur/
git clone -b v1.16.0 --depth 1 https://github.com/tloncorp/landscape.git lan
cp lan/desk/mar/docket* full/mar/
cp lan/desk/lib/docket* full/lib/
cp lan/desk/sur/docket* full/sur/
```

#### Front-end Workflows ####

In order to test the web package deployment process for the current
front-end build, run the following commands:

```bash
cd ./ui
npm run build
cd ..
./durploy desk -g zod vcc-trade ./ui/dist/
cp "$(ls -dtr1 "${XDG_CACHE_HOME:-$HOME/.cache}/durploy/glob"/* | tail -1)" ./meta/glob
```


[urbit]: https://urbit.org
[ventureclub.club]: https://venture.club
[durploy]: https://github.com/sidnym-ladrut/durploy

[fakezod]: https://developers.urbit.org/guides/core/environment#development-ships
[react]: https://reactjs.org/
[tailwind css]: https://tailwindcss.com/
[vite]: https://vitejs.dev/
