<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Метод не поддерживается'], JSON_UNESCAPED_UNICODE);
    exit;
}

$recipient = 'parts@ussury.com';
$formType = isset($_POST['form_type']) ? trim((string)$_POST['form_type']) : 'parts';
$subjectRaw = isset($_POST['subject']) ? trim((string)$_POST['subject']) : 'Сообщение с сайта Оригинал';
$subjectRaw = str_replace(["\r", "\n"], ' ', $subjectRaw);

$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Укажите корректный e-mail'], JSON_UNESCAPED_UNICODE);
    exit;
}

$labels = [
    'manufacturer' => 'Производитель авто',
    'frame'        => 'Номер шасси / рамы / кузова',
    'part'         => 'Необходимая запчасть',
    'comment'      => 'Комментарий',
    'model'        => 'Марка авто',
    'year'         => 'Год выпуска',
    'vin'          => 'VIN',
    'engine'       => 'Модель двигателя',
    'volume'       => 'Объём двигателя',
    'fuel'         => 'Тип топлива',
    'question'     => 'Вопрос',
    'check'        => 'Проверка',
    'email'        => 'E-mail для обратной связи',
];

// Keep the simple anti-spam check for the question form.
if ($formType === 'question') {
    $check = isset($_POST['check']) ? trim((string)$_POST['check']) : '';
    if ($check !== '4') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Неверный ответ проверки'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$lines = [];
$lines[] = $formType === 'question' ? 'Вопрос продавцу с сайта «Оригинал»' : 'Запрос на подбор запчасти с сайта «Оригинал»';
$lines[] = 'Дата: ' . date('d.m.Y H:i');
$lines[] = '';

foreach ($labels as $key => $label) {
    if (!isset($_POST[$key])) continue;
    $value = trim((string)$_POST[$key]);
    if ($value === '') continue;
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $lines[] = $label . ': ' . $value;
}

$body = implode("\r\n", $lines);
$encodedSubject = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader($subjectRaw, 'UTF-8', 'B', "\r\n")
    : $subjectRaw;

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: Сайт Оригинал <noreply@ussury.com>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail($recipient, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Сервер не смог отправить письмо. Проверьте настройку PHP mail/SMTP на хостинге.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
