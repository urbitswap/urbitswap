# `urbitswap` Tests #

## Scry Tests ##

```
.^(bean %gu /=swap-traders=/~zod/master)
.^((map @ux @p) %gx /=swap-traders=/~zod/master/noun)
.^(json %gx /=swap-traders=/~zod/master/json)
```

## Poke Tests ##

```
:swap-traders &swap-action [[~zod %master] %asoc 0x1234 0xabcd]
```

## Mark Tests ##

```
=s -build-file /=urbitswap=/sur/swap/hoon
=j2a -build-tube /=urbitswap=/json/swap-action
=j2ag |=(t=@t !<(action:s (j2a !>((need (de:json:html t))))))
(j2ag '{"traders": "~zod/b", "update": {"init": null}}')
(j2ag '{"traders": "~zod/b", "update": {"drop": null}}')
(j2ag '{"traders": "~zod/b", "update": {"join": null}}')
(j2ag '{"traders": "~zod/b", "update": {"asoc": {"addr": "0x00001234", "sign": "0xdEaDbEeF"}}}')
```

```
=s -build-file /=urbitswap=/sur/swap/hoon
=a2j -build-tube /=urbitswap=/swap-action/json
=a2jg |=(a=action:s (en:json:html !<(json (a2j !>(a)))))
(a2jg [[our %b] %init ~])
(a2jg [[our %b] %drop ~])
(a2jg [[our %b] %join ~])
(a2jg [[our %b] %asoc 0xdead.beef 0xcafe.babe])
```

## Useful Commands ##

In debug mode, the `sign` field is ignored, enabling simplified testing/configuration:

```
=s -build-file /=urbitswap=/sur/swap/hoon
=j2a -build-tube /=urbitswap=/json/swap-action
=j2ag |=(t=@t !<(action:s (j2a !>((need (de:json:html t))))))
:swap-traders &swap-action (j2ag '{"traders": "~zod/master", "update": {"asoc": {"addr": "", "sign": "0x0"}}}')
```
