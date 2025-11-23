using UnityEngine;
using UnityEngine.SceneManagement;

public class Out : MonoBehaviour
{
    private void OnTriggerEnter(Collider col)
    {
        if(col.gameObject.tag == "Player")
        {
            SceneManagement.LoadScene(SceneManager.GetActiveScene().name);
        }
    }
}