# -*- coding: utf-8 -*-
import requests
import json

# Dify API配置
API_BASE_URL = 'http://localhost'
API_TOKEN = 'app-v2ZsPiQjtVqNbtaPBoHvBYvt'
API_USER = 'Descartes'

def test_dify_connection():
    """测试Dify API连接"""
    print('测试Dify API连接...')
    
    # 测试基本连接
    try:
        response = requests.get(f'{API_BASE_URL}/health', timeout=5)
        print(f'Dify服务连接成功: {response.status_code}')
    except Exception as e:
        print(f'Dify服务连接失败: {e}')
        return False
    
    # 测试工作流API
    print('\n测试工作流API...')
    workflow_url = f'{API_BASE_URL}/v1/workflows/run'
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_TOKEN}'
    }
    
    # 测试数据
    test_data = {
        'inputs': {
            'personalized_prompts': '测试连接'
        },
        'response_mode': 'blocking',
        'user': API_USER
    }
    
    try:
        response = requests.post(workflow_url, json=test_data, headers=headers, timeout=10)
        print(f'工作流API响应状态: {response.status_code}')
        
        if response.status_code == 200:
            result = response.json()
            print('工作流API调用成功！')
            print(f'响应内容: {json.dumps(result, indent=2, ensure_ascii=False)}')
            return True
        else:
            print(f'工作流API调用失败: {response.status_code}')
            print(f'错误信息: {response.text}')
            return False
            
    except Exception as e:
        print(f'工作流API调用异常: {e}')
        return False

if __name__ == '__main__':
    print('=' * 50)
    print('Dify API 连接测试')
    print('=' * 50)
    
    test_dify_connection()
    
    print('\n' + '=' * 50)
    print('测试完成')
    print('=' * 50)
