import requests
import json
import os
 
class DifyAPIClient:
    """通用Dify API客户端"""
    
    def __init__(self, api_key, base_url="http://localhost"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def upload_file(self, local_file_path):
        """
        上传文件
        """
        # 替换为你的实际文件类型
        file_type =  'application/txt'
        # 替换为你的实际用户标识
        user = "Descartes"

        url = f"{self.base_url}/v1/files/upload"
        headers = {'Authorization': f'Bearer {self.api_key}'}

        # 打开本地文件
        with open(local_file_path, 'rb') as file:
            # 构建表单数据
            files = {
                'file': (local_file_path, file, file_type)
            }
            data = {
                'user': user
            }

            # 发送 POST 请求
            response = requests.post(url, headers=headers, files=files, data=data)

        # 检查响应状态码
        if response.status_code == 201:
            print("文件上传成功")
            print(response.json())
            id = response.json()['id']
            return id
        else:
            print(f"文件上传失败，状态码: {response.status_code}")
            print(response.text)

    def run_workflow(self, workflow_inputs, file_id=None, timeout=300):
        """执行工作流"""
        workflow_url = f"{self.base_url}/v1/workflows/run"
        
        # 构建请求数据
        data = {
            "inputs": workflow_inputs,
            "response_mode": "blocking",
            "user": "Descartes"
        }
        
        # # 如果有文件，添加到inputs中
        # if file_id:
        #     data["inputs"]["file"] = {
        #         "type": "document",
        #         "transfer_method": "local_file",
        #         "upload_file_id": file_id
        #     }
        
        print(f"🔄 调用工作流...")
        print(f"输入参数: {json.dumps(data['inputs'], ensure_ascii=False, indent=2)}")
        
        try:
            response = requests.post(workflow_url, headers=self.headers, 
                                   json=data, timeout=timeout)
            
            if response.status_code == 200:
                result = response.json()
                print("✅ 工作流执行成功！")
                return result.get('answer', result)
            else:
                print(f"❌ 工作流执行失败: {response.status_code}")
                print(f"错误信息: {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            print("❌ 请求超时")
            return None
        except Exception as e:
            print(f"❌ 执行异常: {e}")
            return None

def main():
    """主函数 - 在这里修改你的配置"""
    
    # ========== 配置区域 ==========
    API_KEY = "app-3Nz7h4fjoBk5dFvvFdv3Ikwv" # 你的API密钥
    BASE_URL = "http://localhost"            # Dify服务地址
    
    # 是否使用文件
    USE_FILE = True               # True: 上传文件, False: 不使用文件
    TIMEOUT = 300                     # 超时时间（秒）
    # ==============================
    # 创建客户端
    client = DifyAPIClient(API_KEY, BASE_URL)
    
    # 待上传文件列表
    file_name_list = ["1.txt", "2.txt", "3.txt"]

    uploaded_files = []
    for name in file_name_list:
        file_id = client.upload_file(name)
        if file_id:
            uploaded_files.append({
                "dify_model_identity": "__dify__file__",
                "upload_file_id": file_id,
                "type": "document",
                "transfer_method": "local_file"
            })
    
    if uploaded_files:
    
        # 工作流输入参数 - 根据你的工作流配置修改
        WORKFLOW_INPUTS = {
            "Input_files": uploaded_files,
            "personalized_prompts": "请你帮我用严肃的语言总结这些文件的主要内容！"      # 示例参数
        }
        
        
        # 执行工作流
        print(f"🚀 执行工作流...")
        result = client.run_workflow(WORKFLOW_INPUTS, file_id, TIMEOUT)
        print(result['data']['outputs']['text'])
    
if __name__ == "__main__":
    main()
  