/-  *vcc
|%
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
    (~(put by traders) addr.upd src.bowl)
  ==
--
