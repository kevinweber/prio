<?php
$redirect_url = $_SERVER['HTTP_REFERER'];

setcookie('prio', false, time() - 60*100000, '/');

header("Location: " . $redirect_url);
?>