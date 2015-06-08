import requests
import urlparse

from secrets import *

def test():
    request = False
    authorize = False
    access = True
    url = secrets['places']['url']
    user = secrets['places']['user']
    request_tokens = secrets['places']['request_tokens']

    if request:
        request_url = url + '/oauth/request_token'
        res = requests.post(request_url, None)
        print res
        print res.text
        request_tokens = urlparse.parse_qs(res.text)
        print request_tokens

    if authorize:
        auth_url = url + '/oauth/add_active_directory_user'
        auth_data = {
            'query': request_tokens,
            'userId': user
        }
        res = requests.post(auth_url, auth_data)
        print res
        display_name = res.text
        print display_name

    if access:
        access_url = url + '/oauth/access_token'
        print access_url
        header = {'authorization': request_tokens}
        res = requests.request('post', url=access_url, headers=header)
        print res
        print res.text
        tokens = urlparse.parse_qs(res.text)
        print tokens


if __name__ == '__main__':
    test()
