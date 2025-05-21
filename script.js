function calculateLevels() {
  const studentName = document.getElementById('studentName').value // 生徒名
  const startDate = new Date(document.getElementById('startDate').value) // 入塾日
  const startGrade = document.getElementById('startGrade').value // 初期学年
  const startLevel = document.getElementById('startLevel').value // 開始レベル
  const isHalfLesson =
    document.querySelector('input[name="isHalfLesson"]:checked').value === 'yes'
  const lessonFrequency = parseInt(
    document.getElementById('lessonFrequency').value
  )

  const levels = [
    'Pre1',
    'Pre2',
    'Pre3',
    'Pre4',
    'BP1',
    'BP2',
    'BP3',
    'BP4',
    'BP5',
    'BP6',
    'BP7',
    'BP8',
    'BP9',
    'BP10',
    'BP11',
    'BP12'
  ]
  const lessonCounts = [
    0, 9, 9, 18, 9, 21, 25, 22, 31, 26, 27, 36, 32, 56, 36, 24, 24
  ] // レベルごとの必要レッスン数

  let targetDate = new Date(startDate) // 現在の日付を初期化
  let targetGrade = startGrade
  const startIndex = levels.indexOf(startLevel) // 開始レベルのインデックス

  const table = document.getElementById('levelTable')

  // **前回の結果をクリア**
  for (let i = 1; i < table.rows.length; i++) {
    table.rows[i].cells[1].textContent = '' // 学年のセルをクリア
    table.rows[i].cells[2].textContent = '' // 日付のセルをクリア
  }

  // 学年を進めるための関数
  function getNextGrade(grade) {
    const gradeOrder = [
      '小3',
      '小4',
      '小5',
      '小6',
      '中1',
      '中2',
      '中3',
      '高1',
      '高2',
      '高3',
      '大1',
      '大2',
      '大3',
      '大4'
    ]
    const index = gradeOrder.indexOf(grade)
    return index < gradeOrder.length - 1 ? gradeOrder[index + 1] : null // 大4を超えたら null を返す
  }

  // 学年を更新するための関数
  function updateGrade(prevDate, targetDate, targetGrade) {
    let resultGrade = targetGrade

    // 年度切り替えが 4月1日
    // 月は 0-based なので 3 が4月、日付は 1-based
    // 例: new Date(year, 3, 1) が4/1

    // 開始年から終了年までループ
    // 余裕をもって +1年 までチェックしておく
    for (
      let y = prevDate.getFullYear();
      y <= targetDate.getFullYear() + 1;
      y++
    ) {
      // 今年度のカットオフ日時
      const cutoffDate = new Date(y, 3, 1) // 4月1日

      // カットオフが開始日より後 かつ 終了日以前 or 同日ならカウント
      if (cutoffDate > prevDate && cutoffDate <= targetDate) {
        resultGrade = getNextGrade(resultGrade)
      }
    }

    return resultGrade
  }

  // 生徒名が入力されていれば、レベルアップイメージを表示
  if (studentName) {
    document.getElementById('levelUpMessage').innerHTML =
      studentName + 'さんのレベルアップイメージ'
  } else {
    document.getElementById('levelUpMessage').innerHTML =
      '名前を入力してください'
  }

  // テーブルを更新するループ
  for (let i = 0; i < levels.length; i++) {
    let row = table.rows[table.rows.length - i - 1] // テーブルの行を逆順に取得
    if (i < startIndex) {
      // 開始レベルより前の行は空欄のままにする
      continue
    }

    let lessonsNeeded = lessonCounts[i]
    if (isHalfLesson && levels[i].startsWith('BP')) {
      lessonsNeeded *= 2 // ハーフレッスンの場合は倍のレッスン数が必要
    }
    console.log('i', i)
    console.log('lessonsNeeded', lessonsNeeded)

    // 初回のみ、開始日をそのまま使用
    if (i === startIndex) {
      row.cells[1].textContent = targetGrade // 学年
      row.cells[2].textContent = targetDate.toLocaleDateString('ja-JP') // 開始日
      row.cells[3].textContent = 'ー'
      continue
    }

    // 前回の日付を保存
    prevDate = new Date(targetDate)

    // 必要な週数を計算し、現在の日付を更新
    let weeksNeeded = Math.ceil(lessonsNeeded / lessonFrequency)
    targetDate.setDate(targetDate.getDate() + weeksNeeded * 7)

    // 4月1日以降に進級する場合、学年を進める
    targetGrade = updateGrade(prevDate, targetDate, targetGrade)

    // 大4を超えたら表示を停止
    if (!targetGrade) {
      break // ループを終了
    }

    // テーブルに情報を表示
    row.cells[1].textContent = targetGrade // 学年
    row.cells[2].textContent = targetDate.toLocaleDateString('ja-JP') // 開始日
    row.cells[3].textContent = weeksNeeded + '週後'

    // 大4に到達したらループを終了
    if (targetGrade === '大4') {
      break
    }
  }
}

// PDF書き出し機能の追加
document.getElementById('downloadPDF').addEventListener('click', function () {
  const studentName = document.getElementById('studentName').value
  const levelUpMessage = studentName
    ? studentName + 'さんのレベルアップイメージ'
    : '名前を入力してください'

  // テーブルをコピーしてPDF用のコンテナを作成
  const table = document.getElementById('levelTable')
  const tableClone = table.cloneNode(true) // テーブルをコピー
  const container = document.createElement('div')

  // レベルアップイメージのテキストを追加
  const levelUpText = document.createElement('h2')
  levelUpText.innerText = levelUpMessage
  levelUpText.style.fontSize = '16px'
  levelUpText.style.marginBottom = '10px'

  // コピーしたテーブルのサイズを調整
  tableClone.style.width = '100%' // テーブルを全幅に設定
  tableClone.style.fontSize = '10px' // フォントサイズを小さく調整
  tableClone.style.borderCollapse = 'collapse' // ボーダーの隙間をなくす

  // コンテナにテキストとコピーしたテーブルを追加
  container.appendChild(levelUpText)
  container.appendChild(tableClone)

  // HTML2PDF.jsのオプション
  const opt = {
    margin: 0.5, // ページ余白を小さめに設定
    filename: studentName + 'さんのレベルアップイメージ.pdf',
    html2canvas: { scale: 2 }, // 解像度を高く設定
    pagebreak: { avoid: 'table' }, // テーブルの分割を防ぐ
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } // 横向き
  }

  // PDF生成
  html2pdf().from(container).set(opt).save()
})

// ページ読み込み時に今日の日付を入力欄に設定する
document.addEventListener('DOMContentLoaded', function () {
  // 今日の日付を取得
  const today = new Date()

  // YYYY-MM-DD形式にフォーマット（input type="date"の形式）
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`

  // 日付入力欄にデフォルト値として設定
  document.getElementById('startDate').value = formattedDate
})
