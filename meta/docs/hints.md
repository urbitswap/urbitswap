# "Urbit's Exchange" Tests #

## Scry Tests ##

```
.^(bean %gu /=exchange-traders=/~zod/master)
.^((map @ux @p) %gx /=exchange-traders=/~zod/master/noun)
.^(json %gx /=exchange-traders=/~zod/master/json)
```

## Poke Tests ##

```
:exchange-traders &exchange-action [[~zod %master] %asoc 0x1234 0xabcd]
```

## Mark Tests ##

```
=e -build-file /=exchange=/sur/exchange/hoon
=j2a -build-tube /=exchange=/json/exchange-action
=j2ag |=(t=@t !<(action:e (j2a !>((need (de:json:html t))))))
(j2ag '{"traders": "~zod/b", "update": {"init": null}}')
(j2ag '{"traders": "~zod/b", "update": {"drop": null}}')
(j2ag '{"traders": "~zod/b", "update": {"join": null}}')
(j2ag '{"traders": "~zod/b", "update": {"asoc": {"addr": "0x1234", "sign": "0xdEaDbEeF"}}}')
```

```
=e -build-file /=exchange=/sur/exchange/hoon
=a2j -build-tube /=exchange=/exchange-action/json
=a2jg |=(a=action:e (en:json:html !<(json (a2j !>(a)))))
(a2jg [[our %b] %init ~])
(a2jg [[our %b] %drop ~])
(a2jg [[our %b] %join ~])
(a2jg [[our %b] %asoc 0xdead.beef 0xcafe.babe])
```

## Useful Commands ##

In debug mode, the `sign` field is ignored, enabling simplified testing/configuration:

```
=e -build-file /=exchange=/sur/exchange/hoon
=j2a -build-tube /=exchange=/json/exchange-action
=j2ag |=(t=@t !<(action:e (j2a !>((need (de:json:html t))))))
:exchange-traders &exchange-action (j2ag '{"traders": "~zod/master", "update": {"asoc": {"addr": "", "sign": "0x0"}}}')
```
