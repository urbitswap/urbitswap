/-  *swap
/+  txn=naive-transactions, config
|%
++  path2flag
  |=  path=[%swap %traders @ @ ~]
  ^-  flag
  [`@p`(slav %p +>-.path) `@tas`(slav %tas +>+<.path)]
++  apply
  |=  [tre=traders bol=bowl:gall flag upd=update]
  ^-  traders
  ?-    -.upd
      %init
    *traders
  ::
      ?(%drop %join)
    *traders
  ::
      %asoc
    =-  ~|  "{<dap.bol>}: user {<src.bol>} provided bad signature for address {<addr.upd>}"
        ?>(- (~(put by tre) addr.upd src.bol))
    ^-  bean
    ?:  !<(bean (slot:config %debug))  %&
    =-  ?=(~ -)
    ^-  (unit @ux)
    ::  FE signs using EIP-191 format; see:
    ::  https://viem.sh/docs/actions/wallet/signMessage.html
    =/  dat=tape  (scow %p src.bol)
    =/  msg=tape  "\19Ethereum Signed Message:\0a{(a-co:co (lent dat))}{dat}"
    ::  FIXME: Should use +crip instead of +rep, but can't due to a bug in
    ::  +crip dealing with tapes containing \00 entries; see:
    ::  https://github.com/urbit/urbit/pull/6818
    =/  syg=octs  (as-octs:mimes:html (rep 3 msg))
    (verify-sig:txn sign.upd syg)
  ==
--
