# VCC Tests #

## Scry Tests ##

```
.^(bean %gu /=vcc-traders=/~zod/master)
.^((map @ux @p) %gx /=vcc-traders=/~zod/master/noun)
.^(json %gx /=vcc-traders=/~zod/master/json)
```

## Poke Tests ##

```
:vcc-traders &vcc-action [[~zod %master] %asoc 0x1234.abcd]
```

## Mark Tests ##

```
=v -build-file /=vcc-trade=/sur/vcc/hoon
=j2a -build-tube /=vcc-trade=/json/vcc-action
=j2ag |=(t=@t !<(action:v (j2a !>((need (de:json:html t))))))
(j2ag '{"traders": "~zod/b", "update": {"init": null}}')
(j2ag '{"traders": "~zod/b", "update": {"drop": null}}')
(j2ag '{"traders": "~zod/b", "update": {"join": null}}')
(j2ag '{"traders": "~zod/b", "update": {"asoc": "0x1234dEaDbEeF"}}')
```

```
=v -build-file /=vcc-trade=/sur/vcc/hoon
=a2j -build-tube /=vcc-trade=/vcc-action/json
=a2jg |=(a=action:v (en:json:html !<(json (a2j !>(a)))))
(a2jg [[our %b] %init ~])
(a2jg [[our %b] %drop ~])
(a2jg [[our %b] %join ~])
(a2jg [[our %b] %asoc 0xdead.beef])
```

## Useful Commands ##

```
=v -build-file /=vcc-trade=/sur/vcc/hoon
=j2a -build-tube /=vcc-trade=/json/vcc-action
=j2ag |=(t=@t !<(action:v (j2a !>((need (de:json:html t))))))
:vcc-traders &vcc-action (j2ag '{"traders": "~zod/master", "update": {"asoc": ""}}')
```
