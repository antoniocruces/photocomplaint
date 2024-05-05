<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

ini_set('upload_max_filesize', 10000000);
ini_set('max_file_uploads', 5);

define("MAILFROM", "info@iarthislab.eu");
define("NAMEFROM", "Fotodenuncia / PhotoComplaint");
define("MAILTO", array("antonio.cruces@uma.es"));

define("MSG", [
	"en" => [
		"language" => "language",
		"date" => "date",
		"ticket" => "ticket",
		"location" => "location",
		"coordinates" => "coordinates",
		"email" => "email",
		"description" => "description",
		"accept" => "accept",
		"images" => "images",
		"subject" => "PhotoComplaint Report"
	],
	"es" => [
		"language" => "idioma",
		"date" => "fecha",
		"ticket" => "ID",
		"location" => "ubicación",
		"coordinates" => "coordenadas",
		"email" => "correo",
		"description" => "descripción",
		"accept" => "aceptación",
		"images" => "imágenes",
		"subject" => "Informe Fotodenuncia"
	]
]);

function newticket($length = 10) {
	return substr(str_shuffle(str_repeat($x = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', ceil($length / strlen($x)))), 1, $length);
}

/* 
 * Custom PHP function to send an email with multiple attachments 
 * $to Recipient email address 
 * $subject Subject of the email 
 * $message Mail body content 
 * $senderEmail Sender email address 
 * $senderName Sender name 
 * $files Files to attach with the email
 * Source: https://www.codexworld.com/send-email-with-multiple-attachments-php/
 */ 
function multi_attach_mail($to, $subject, $message, $senderEmail, $senderName, $files = array(), $names = array()) { 
	// Sender info
	$from = $senderName." <".$senderEmail.">";
	$headers = "From: $from";
 
	// Boundary
	$semi_rand = md5(time());
	$mime_boundary = "==Multipart_Boundary_x{$semi_rand}x";
 
	// Headers for attachment
	$headers .= "\nMIME-Version: 1.0\n" . "Content-Type: multipart/mixed;\n" . " boundary=\"{$mime_boundary}\"";  
 
	// Multipart boundary  
	$message = "--{$mime_boundary}\n" . "Content-Type: text/html; charset=\"UTF-8\"\n" . "Content-Transfer-Encoding: 7bit\n\n" . $message . "\n\n";  
 
	// Preparing attachment 
	if(!empty($files)){ 
		for($i = 0; $i < count($files); $i++) { 
			if(is_file($files[$i])) { 
				$file_name = $names[$i]; //basename($files[$i]); 
				$file_size = filesize($files[$i]); 

				$message .= "--{$mime_boundary}\n"; 
				$fp = @fopen($files[$i], "rb"); 
				$data =  @fread($fp, $file_size); 
				@fclose($fp); 
				$data = chunk_split(base64_encode($data)); 
				$message .= "Content-Type: application/octet-stream; name=\"".$file_name."\"\n" . "Content-Description: " . $file_name."\n" . "Content-Disposition: attachment;\n" . " filename=\"".$file_name."\"; size=".$file_size.";\n" .  "Content-Transfer-Encoding: base64\n\n" . $data . "\n\n"; 
			}
		}
	}

	$message .= "--{$mime_boundary}--";
	$returnpath = "-f" . $senderEmail;

	// Send email
	$mail = mail($to, $subject, $message, $headers, $returnpath);

	// Return true if email sent, otherwise return false
	if($mail) {
		return true;
	} else {
		return false;
	}
}

function build_message($ticket) {
	date_default_timezone_set('Europe/Madrid');
	$t = MSG[$_POST['language']];
	$content = array();
	$content []= '<table width="100%" border="1" cellspacing="0" cellpadding="5" role="presentation" style="margin-bottom:1rem">';
	$content []= '<tr><td>' . $t['date'] . '</td><td>' . date('d-m-yy h:i:s') . '</td></tr>';
	$content []= '<tr><td>' . $t['ticket'] . '</td><td>' . $ticket . '</td></tr>';
	$content []= '<tr><td>' . $t['email'] . '</td><td>' . filter_var($_POST['email'], FILTER_SANITIZE_EMAIL) . '</td></tr>';
	$content []= '<tr><td>' . $t['location'] . '</td><td>' . htmlspecialchars($_POST['location']) . '</td></tr>';
	$content []= '<tr><td>' . $t['coordinates'] . '</td><td>' . htmlspecialchars($_POST['coordinates']) . '</td></tr>';
	$content []= '<tr><td>' . $t['description'] . '</td><td>' . nl2br(htmlspecialchars($_POST['description'])) . '</td></tr>';
	$content []= '<tr><td>' . $t['images'] . ' [' . count($_FILES['files']['name']) . ']</td><td>' . implode(', ', $_FILES['files']['name']) . '</td></tr>';
	$content []= '</table>';
	return implode("\n", $content);
}

function build_subject($ticket) {
	$t = MSG[$_POST['language']];
	return $t['subject'] . ' TK: ' . $ticket;
}

$files = $_FILES['files']['tmp_name'];
$names = $_FILES['files']['name'];

$ticket = newticket();
$text = build_message($ticket, $_POST);
$subject = build_subject($ticket);
$status = [];

foreach(MAILTO as $m) {
	$status []= multi_attach_mail($m, $subject, $text, MAILFROM, NAMEFROM, $files, $names);
}

$response = array("status" => $status, "ticket" => $ticket, "files" => $names);
header("Content-Type: application/json");
echo json_encode($response);

exit();

?>