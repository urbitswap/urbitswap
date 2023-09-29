|%
+$  traders  (jug @p @ux)  ::  NOTE: For MVP, @p->@ux is 1->many
+$  flag  (pair ship term)
+$  action  (pair flag update)
+$  update
  $%  [%ledger-make ~]
      [%ledger-drop ~]
      [%lentry-push ship=@p addr=@ux]
      [%placeholder ~]  :: to avoid mint vain errors with ?+
  ==
--
