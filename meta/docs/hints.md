# VCC Tests #

## Scry Tests ##

```
.^(bean %gu /=vcc-traders=/~zod/master)
.^((map @ux @p) %gx /=vcc-traders=/~zod/master/noun)
.^(json %gx /=vcc-traders=/~zod/master/json)
```

## Poke Tests ##

```
:vcc-traders &vcc-action [[~zod %master] %asoc 0x1234 0xabcd]
```

## Mark Tests ##

```
=v -build-file /=vcc-trade=/sur/vcc/hoon
=j2a -build-tube /=vcc-trade=/json/vcc-action
=j2ag |=(t=@t !<(action:v (j2a !>((need (de:json:html t))))))
(j2ag '{"traders": "~zod/b", "update": {"init": null}}')
(j2ag '{"traders": "~zod/b", "update": {"drop": null}}')
(j2ag '{"traders": "~zod/b", "update": {"join": null}}')
(j2ag '{"traders": "~zod/b", "update": {"asoc": {"addr": "0x1234", "sign": "0xdEaDbEeF"}}}')
```

```
=v -build-file /=vcc-trade=/sur/vcc/hoon
=a2j -build-tube /=vcc-trade=/vcc-action/json
=a2jg |=(a=action:v (en:json:html !<(json (a2j !>(a)))))
(a2jg [[our %b] %init ~])
(a2jg [[our %b] %drop ~])
(a2jg [[our %b] %join ~])
(a2jg [[our %b] %asoc 0xdead.beef 0xcafe.babe])
```

## Useful Commands ##

In debug mode, the `sign` field is ignored, enabling simplified testing/configuration:

```
=v -build-file /=vcc-trade=/sur/vcc/hoon
=j2a -build-tube /=vcc-trade=/json/vcc-action
=j2ag |=(t=@t !<(action:v (j2a !>((need (de:json:html t))))))
:vcc-traders &vcc-action (j2ag '{"traders": "~zod/master", "update": {"asoc": {"addr": "", "sign": "0x0"}}}')
```
