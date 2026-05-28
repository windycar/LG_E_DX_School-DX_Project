param(
    [string]$Text = "",
    [switch]$Loop
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$ModelPath = Join-Path $Root "models\diary_emotion_nb_model.json"
$LabelMapPath = Join-Path $Root "data\processed\label_map.json"

function Normalize-Text {
    param([string]$Value)
    return (($Value.Trim().ToLower() -split "\s+") -join " ")
}

function Add-Feature {
    param(
        [hashtable]$Features,
        [string]$Key,
        [int]$Count = 1
    )
    if ($Features.ContainsKey($Key)) {
        $Features[$Key] += $Count
    } else {
        $Features[$Key] = $Count
    }
}

function Extract-Features {
    param([string]$Value)

    $normalized = Normalize-Text $Value
    $compact = $normalized.Replace(" ", "")
    $features = @{}

    foreach ($token in ($normalized -split " ")) {
        if ($token.Length -ge 2) {
            Add-Feature $features "w:$token"
        }
    }

    foreach ($n in @(2, 3)) {
        if ($compact.Length -ge $n) {
            for ($i = 0; $i -le $compact.Length - $n; $i++) {
                Add-Feature $features "c${n}:$($compact.Substring($i, $n))"
            }
        }
    }

    return $features
}

function Get-JsonPropertyValue {
    param(
        [object]$Object,
        [string]$Name,
        [object]$DefaultValue = $null
    )

    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) {
        return $DefaultValue
    }
    return $property.Value
}

function Get-ContrastTail {
    param([string]$Value)

    $markers = @("근데", "그런데", "하지만", "그래도", "다만", "결국", "이후에는", "그러다")
    $bestIndex = -1
    $bestMarker = ""
    foreach ($marker in $markers) {
        $index = $Value.LastIndexOf($marker)
        if ($index -gt $bestIndex) {
            $bestIndex = $index
            $bestMarker = $marker
        }
    }

    if ($bestIndex -lt 0) {
        return ""
    }

    $tail = $Value.Substring($bestIndex + $bestMarker.Length).Trim(" ", ",", ".", "!", "?", "~")
    if ($tail.Length -lt 4) {
        return ""
    }
    return $tail
}

function Get-RawScores {
    param(
        [object]$Model,
        [string]$Value
    )

    $features = Extract-Features $Value
    $vocabulary = @{}
    foreach ($feature in $Model.vocabulary) {
        $vocabulary[$feature] = $true
    }

    $scores = @{}
    foreach ($label in $Model.labels) {
        $prior = [double](Get-JsonPropertyValue $Model.priors $label 0)
        $featureCounts = Get-JsonPropertyValue $Model.feature_counts $label
        $featureTotal = [double](Get-JsonPropertyValue $Model.feature_totals $label 0)
        $denominator = $featureTotal + $Model.vocabulary.Count
        $evidence = 0.0
        $evidenceCount = 0

        foreach ($feature in $features.Keys) {
            if ($vocabulary.ContainsKey($feature)) {
                $featureCount = [double](Get-JsonPropertyValue $featureCounts $feature 0)
                $count = [int]$features[$feature]
                $evidence += [Math]::Log(($featureCount + 1) / $denominator) * $count
                $evidenceCount += $count
            }
        }

        $score = $prior
        if ($evidenceCount -gt 0) {
            $score += $evidence / $evidenceCount
        }
        $scores[$label] = $score
    }

    return $scores
}

function Convert-ScoresToProbabilities {
    param([hashtable]$Scores)

    $maxScore = ($Scores.Values | Measure-Object -Maximum).Maximum
    $expScores = @{}
    $total = 0.0
    foreach ($label in $Scores.Keys) {
        $value = [Math]::Exp($Scores[$label] - $maxScore)
        $expScores[$label] = $value
        $total += $value
    }

    $probabilities = @{}
    foreach ($label in $expScores.Keys) {
        $probabilities[$label] = $expScores[$label] / $total
    }
    return $probabilities
}

function Add-LexiconBoost {
    param(
        [hashtable]$Scores,
        [string]$Value,
        [double]$Weight
    )

    $boosts = @{
        "행복" = @("행복", "기쁘", "기분 좋", "좋았", "좋더", "좋아", "맛있", "만족", "뿌듯", "감사", "고마", "웃음", "즐거")
        "안정" = @("안정", "안심", "안도", "편안", "차분", "괜찮", "다행", "마음이 놓")
        "설렘" = @("설레", "설렜", "두근", "기대", "기다려", "신기", "얼른 보고", "태어날 생각")
        "중립" = @("평범", "무난", "특별한 일 없이", "큰 감정 변화")
        "불안" = @("불안", "걱정", "초조", "두려", "무섭", "괜찮을까", "문제가 있을까", "어떡")
        "피로" = @("피곤", "피로", "지쳐", "지친", "지치", "힘들", "무기력", "몸이 무거", "잠도 잘 못")
        "우울" = @("우울", "슬프", "서럽", "눈물", "울고", "외롭", "속상", "상처", "가라앉")
        "화남" = @("화가", "화나", "짜증", "분노", "억울", "열받", "싸워", "욕")
    }

    $boosted = @{}
    foreach ($label in $Scores.Keys) {
        $boosted[$label] = [double]$Scores[$label]
    }
    foreach ($label in $boosts.Keys) {
        $count = 0
        foreach ($keyword in $boosts[$label]) {
            if ($Value.Contains($keyword)) {
                $count += 1
            }
        }
        if ($count -gt 0 -and $boosted.ContainsKey($label)) {
            $boosted[$label] += $count * $Weight
        }
    }
    return $boosted
}

function Add-ShortDailyGuard {
    param(
        [hashtable]$Scores,
        [string]$Value
    )

    $positiveFoodWords = @("맛있", "맛나", "든든", "잘 먹", "먹고 기분", "먹었는데 좋")
    $dailyWords = @("먹었다", "먹었", "마셨", "산책", "쉬었다", "잤다", "봤다", "했다")
    $negativeWords = @("화", "짜증", "억울", "불안", "걱정", "우울", "슬프", "힘들", "피곤", "아프")

    $boosted = @{}
    foreach ($label in $Scores.Keys) {
        $boosted[$label] = [double]$Scores[$label]
    }

    $hasPositiveFood = $false
    foreach ($word in $positiveFoodWords) {
        if ($Value.Contains($word)) {
            $hasPositiveFood = $true
            break
        }
    }

    $hasDaily = $false
    foreach ($word in $dailyWords) {
        if ($Value.Contains($word)) {
            $hasDaily = $true
            break
        }
    }

    $hasNegative = $false
    foreach ($word in $negativeWords) {
        if ($Value.Contains($word)) {
            $hasNegative = $true
            break
        }
    }

    if ($hasPositiveFood) {
        $boosted["행복"] += 1.4
        $boosted["화남"] -= 0.8
        $boosted["우울"] -= 0.5
        $boosted["불안"] -= 0.5
    } elseif ($hasDaily -and -not $hasNegative) {
        $boosted["중립"] += 0.55
        $boosted["화남"] -= 0.35
    }

    return $boosted
}

function Predict-Emotion {
    param(
        [object]$Model,
        [string]$Value
    )

    $scores = Get-RawScores $Model $Value
    $scores = Add-LexiconBoost $scores $Value 0.45
    $scores = Add-ShortDailyGuard $scores $Value
    $tail = Get-ContrastTail $Value
    if (-not [string]::IsNullOrWhiteSpace($tail)) {
        $tailScores = Get-RawScores $Model $tail
        $tailScores = Add-LexiconBoost $tailScores $tail 0.75
        $tailScores = Add-ShortDailyGuard $tailScores $tail
        $combinedScores = @{}
        foreach ($label in $Model.labels) {
            $combinedScores[$label] = ([double]$scores[$label] * 0.35) + ([double]$tailScores[$label] * 0.65)
        }
        $scores = $combinedScores
    }

    $probabilities = Convert-ScoresToProbabilities $scores
    $best = $probabilities.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1
    return @{
        Prediction = $best.Key
        Probabilities = $probabilities
    }
}

function Write-PredictionJson {
    param(
        [object]$Model,
        [object]$LabelMap,
        [string]$Value
    )

    $predictionResult = Predict-Emotion $Model $Value
    $probabilities = $predictionResult.Probabilities
    $prediction = $predictionResult.Prediction

    $ranking = $probabilities.GetEnumerator() |
        Sort-Object Value -Descending |
        ForEach-Object {
            [ordered]@{
                emotion = $_.Key
                probability = [Math]::Round([double]$_.Value, 4)
            }
        }

    $result = [ordered]@{
        input = $Value
        main_emotion = $prediction
        confidence = [Math]::Round([double]$probabilities[$prediction], 4)
        description = (Get-JsonPropertyValue $LabelMap.description $prediction "")
        ranking = @($ranking)
    }

    $result | ConvertTo-Json -Depth 6
}

if (-not (Test-Path $ModelPath)) {
    throw "Model file not found: $ModelPath"
}

$model = Get-Content -LiteralPath $ModelPath -Raw -Encoding UTF8 | ConvertFrom-Json
$labelMap = Get-Content -LiteralPath $LabelMapPath -Raw -Encoding UTF8 | ConvertFrom-Json

if ($Loop) {
    Write-Host ""
    Write-Host "Diary Emotion Analyzer"
    Write-Host "Type diary text and press Enter."
    Write-Host "Press Enter with empty text to exit."
    Write-Host ""

    while ($true) {
        $loopText = Read-Host "Diary text"
        if ([string]::IsNullOrWhiteSpace($loopText)) {
            exit 0
        }
        Write-PredictionJson $model $labelMap $loopText
        Write-Host ""
    }
}

if ([string]::IsNullOrWhiteSpace($Text)) {
    $Text = Read-Host "Diary text"
}

if ([string]::IsNullOrWhiteSpace($Text)) {
    Write-Host "No text entered."
    exit 1
}

Write-PredictionJson $model $labelMap $Text
