import os
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
import database

router = APIRouter(tags=["Appliances & Smart Home"])

def get_family_master_id(user_id: int, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role.upper() == "GUARDIAN" and user.parent_user_id:
        return user.parent_user_id
    return user_id

@router.post("/api/appliances/bulk")
def update_appliances_bulk(payload: schemas.ApplianceSettingsBulkUpsert, db: Session = Depends(database.get_db)):
    try:
        master_id = get_family_master_id(payload.user_id, db)
        for item in payload.settings:
            setting = db.query(models.ApplianceSetting).filter(
                models.ApplianceSetting.user_id == master_id,
                models.ApplianceSetting.appliance_name == item.appliance_name
            ).first()
            if setting:
                setting.control_command = item.control_command
                setting.execution_status = item.execution_status
            else:
                new_setting = models.ApplianceSetting(
                    user_id=master_id,
                    appliance_name=item.appliance_name,
                    control_command=item.control_command,
                    execution_status=item.execution_status
                )
                db.add(new_setting)
        db.commit()
        return {"status": "Success", "message": "가족 연동 가전 설정이 저장되었습니다!"}
    except Exception as e:
        db.rollback()
        return {"status": "Error", "message": str(e)}

@router.get("/api/appliances/{user_id}")
def get_user_appliances(user_id: int, db: Session = Depends(database.get_db)):
    try:
        master_id = get_family_master_id(user_id, db)
        settings = db.query(models.ApplianceSetting).filter(models.ApplianceSetting.user_id == master_id).all()
        result = []
        for s in settings:
            result.append({
                "appliance_name": s.appliance_name,
                "control_command": s.control_command,
                "execution_status": s.execution_status
            })
        return {"status": "Success", "settings": result}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@router.get("/api/ai/recommend-appliances/{user_id}")
def recommend_appliances(user_id: int, db: Session = Depends(database.get_db)):
    try:
        master_id = get_family_master_id(user_id, db)
        logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == master_id).all()
        
        emotion_weights = {
            "행복": 1.0, "안정": 1.0, "설렘": 1.0,     
            "중립": 0.0,                               
            "불안": -1.0, "피로": -1.0, "우울": -1.0, "화남": -1.0 
        }
        
        learned_temp = 24.0  
        learned_humidity = 50.0 
        learning_rate = 0.15  
        
        for log in logs:
            if log.temperature_ambient is not None and log.humidity_ambient is not None:
                weight = emotion_weights.get(log.selected_emotion, 0.0)
                temp_diff = float(log.temperature_ambient) - learned_temp
                hum_diff = float(log.humidity_ambient) - learned_humidity
                learned_temp += temp_diff * weight * learning_rate
                learned_humidity += hum_diff * weight * learning_rate
                
        learned_temp = max(21.0, min(27.0, learned_temp))
        learned_humidity = max(40.0, min(60.0, learned_humidity))

        WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
        current_temp = 25.0
        current_humidity = 55.0
        current_weather_desc = "맑음"
        
        if WEATHER_API_KEY:
            try:
                res = requests.get(f"http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid={WEATHER_API_KEY}&units=metric&lang=kr")
                if res.status_code == 200:
                    w_data = res.json()
                    current_temp = float(w_data['main']['temp'])
                    current_humidity = float(w_data['main']['humidity'])
                    current_weather_desc = w_data['weather'][0]['description']
            except Exception:
                pass

        final_optimal_temp = learned_temp + (current_temp - learned_temp) * 0.1
        final_optimal_temp = round(max(22.0, min(26.0, final_optimal_temp)), 1)
        
        final_optimal_humidity = learned_humidity + (current_humidity - learned_humidity) * 0.05
        final_optimal_humidity = round(max(45.0, min(60.0, final_optimal_humidity)), 1)
        
        recommendations = []
        
        if current_temp > final_optimal_temp + 0.5:
            recommendations.append({
                "key": "aircon", "name": "에어컨", "action": f"{int(final_optimal_temp)}℃ 냉방", "icon": "❄️",
                "reason": f"현재 실외({int(current_temp)}℃)가 더운 상태입니다. 최적 온도({final_optimal_temp}℃)로 낮출게요.",
                "settings": {"temp": int(final_optimal_temp), "mode": "냉방", "fan": 2}
            })
        elif current_temp < final_optimal_temp - 0.5:
            recommendations.append({
                "key": "aircon", "name": "에어컨", "action": f"{int(final_optimal_temp)}℃ 난방", "icon": "☀️",
                "reason": f"바깥 날씨({int(current_temp)}℃)가 쌀쌀합니다. 최적 온도({final_optimal_temp}℃)로 온도를 올릴게요.",
                "settings": {"temp": int(final_optimal_temp), "mode": "난방", "fan": 1}
            })
            
        if current_humidity > final_optimal_humidity + 4.0:
            recommendations.append({
                "key": "dehumidifier", "name": "제습기", "action": f"{int(final_optimal_humidity)}% 제습", "icon": "🌊",
                "reason": f"실외 습도({int(current_humidity)}%)가 높아 실내 유입이 우려됩니다. 최적 습도({final_optimal_humidity}%)로 보정할게요.",
                "settings": {"humidity": int(final_optimal_humidity), "intensity": 2}
            })
        elif current_humidity < final_optimal_humidity - 4.0:
            recommendations.append({
                "key": "humidifier", "name": "가습기", "action": f"{int(final_optimal_humidity)}% 가습", "icon": "💧",
                "reason": f"현재 공기({int(current_humidity)}%)가 많이 건조합니다. 쾌적 최적 습도({final_optimal_humidity}%)로 조절할게요.",
                "settings": {"humidity": int(final_optimal_humidity), "intensity": 2}
            })
            
        if any(keyword in current_weather_desc for keyword in ["비", "흐림", "구름", "안개", "먼지"]):
            recommendations.append({
                "key": "airPurifier", "name": "공기청정기", "action": "자동 모드", "icon": "💨",
                "reason": f"현재 바깥 날씨가 '{current_weather_desc}' 상태로 환기가 제한되므로 실내 공기를 정화 가동합니다.",
                "settings": {"mode": "자동", "speed": 2}
            })
            
        return {
            "status": "Success",
            "optimal_temp": final_optimal_temp,
            "optimal_humidity": final_optimal_humidity,
            "current_temp": int(current_temp),
            "current_weather": current_weather_desc,
            "recommendations": recommendations
        }
    except Exception as e:
        return {"status": "Error", "message": str(e)}