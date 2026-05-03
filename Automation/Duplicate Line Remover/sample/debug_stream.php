<?php
$f = new SplFileObject('sample/test_simple.txt', 'r');
$f->setFlags(SplFileObject::DROP_NEW_LINE);
$i = 0;
while (!$f->eof()) {
    $l = $f->fgets();
    if ($l === false) break;
    $l = rtrim($l, "\r");
    printf("[%d] '%s' (len=%d)\n", ++$i, $l, strlen($l));
}
