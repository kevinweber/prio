<?php
include_once('settings.php');
include_once('private.settings.php'); // CLIENT_SECRET

$get_access_token_url = 'https://www.wunderlist.com/oauth/access_token';
$data = array('client_id' => CLIENT_ID,
              'client_secret' => CLIENT_SECRET,
              'code' => $_GET['code'] // This code is passed after authorization via Wunderlist
             );
$redirect_url = AUTH_CALLBACK_URL;

// Use key 'http' even if you send the request to https://...
$options = array(
    'http' => array(
        // 'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data),
    ),
);
$context  = stream_context_create($options);
$result = file($get_access_token_url, false, $context);
if ($result === FALSE) {
  $redirect_url .= "?error";
} else {
  $result = json_decode($result[0], true);  // Decode result to array
  $redirect_url .= '?access_token=' . $result['access_token'];
}

header("Location: " . $redirect_url);
?>