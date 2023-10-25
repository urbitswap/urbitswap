# `urbitswap` MVP Architecture #

## Back-end Overview ##

The primary purpose of the `urbitswap` back-end is to manage a list of associations
between Urbit ships and Ethereum wallets to enable on-network communications
related to asset trading.

In its most general form, this is a many-to-many association, but we constrain
it to a one-to-many association (i.e. one ship to many wallets) for the
purposes of the MVP. In the case of ship/wallet pair conflicts, the most
recently registered association takes precedence.

The list of ship/wallet associations is referred to as a **trader list**. Each
ship can host arbitrarily many trader lists, each of which are uniquely identified
by an Urbit [`term`](https://developers.urbit.org/guides/additional/strings#term).
Each ship can also synchronize the state of arbitrarily many trader lists hosted
on remote machines. When a ship learns of a new ship/wallet association, it can
choose to propagate that association to any number of local and remote lists.

For the purposes of the MVP, only a small subset of this functionality will be
exposed to users. Each Urbit ship that runs the `urbitswap` app will automatically
subscribe to a single master list hosted on the same ship distributing the app
source code, and will only be able to report its own personal associations
(i.e. this ship is associated with these wallets) to this list. These
constraints produce a semi-centralized model, which will boost reliability for
demoing purposes without significant performance penalties.

## Back-end Endpoints ##

### Scry ###

- `.^((map @ux @p) %gx /=traders=/ship/list/noun)`: Return the full map
  of ship-to-address associations on a particular ship.

### Poke ###

- `[%asoc addr=@ux]`: Add the given address to the list of known addresses for
  the source ship.

### Subs ###

- `/=traders=/ship/list/`: The master subscription feed for all changes
  that occur to a particular list.
