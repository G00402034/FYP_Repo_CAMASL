import subprocess

input_model = r"C:/Users/sean1/OneDrive - Atlantic TU/Year 4/PROJ ENGINEERING/Project Docs\ASL_modelFinal_Tested.h5"
output_dir = r"C:/Users/sean1/OneDrive - Atlantic TU/Year 4/PROJ ENGINEERING/asl-recogntion-app_Presentation/public/model"

subprocess.run(["tensorflowjs_converter", "--input_format=keras", input_model, output_dir])
