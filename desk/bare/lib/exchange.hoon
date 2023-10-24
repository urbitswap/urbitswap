/-  *exchange
/+  eth=ethereum, txn=naive-transactions
|%
++  dbug  %&
++  apply
  |=  [=traders =bowl:gall =action]
  ^-  ^traders
  =/  flag=flag   p.action
  =/  upd=update  q.action
  ?-    -.upd
      %init
    ?.  =(0 ~(wyt by traders))
      traders
    *^traders
  ::
      ?(%drop %join)
    *^traders
  ::
      %asoc
    =-  ~|  "%exchange: user {<src.bowl>} provided bad signature for address {<addr.upd>}"
        ?>(- (~(put by traders) addr.upd src.bowl))
    ^-  @f
    ?:  dbug
      %.y
    =-  =(- addr.upd)
    ^-  @ux
    ::  FE signs using EIP-191 format; see:
    ::  https://viem.sh/docs/actions/wallet/signMessage.html
    =/  raw-msg=@t    (scot %p src.bowl)
    =/  raw-oct=octs  (as-octs:mimes:html raw-msg)
    =/  enc-msg=@t
      %-  crip
      ;:  welp
          "\19Ethereum Signed Message:\0a"
          (scow %ud p.raw-oct)
          (trip raw-msg)
      ==
    =/  enc-oct=octs  (as-octs:mimes:html enc-msg)
    (fall (verify-sig:txn sign.upd enc-oct) +(addr.upd))
  ==
--
